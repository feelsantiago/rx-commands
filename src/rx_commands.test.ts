/* eslint-disable @typescript-eslint/no-empty-function */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RxCommand } from "./rx_commands.js";
import { subscribeSpyTo } from "@hirez_io/observer-spy";
import { BehaviorSubject, of } from "rxjs";
import { CommandResult } from "./command_result.js";

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("RxCommand", () => {
	beforeEach(() => {
		vi.useRealTimers();
	});

	it("Should instantiate and call a sync command", () => {
		const command = RxCommand.create<string, string>((param) => {
			return "RESULT + " + param;
		});

		const spy = subscribeSpyTo(command.observable);
		command("Test");

		expect(spy.getValuesLength()).toBe(1);
		expect(spy.getFirstValue()).toBe("RESULT + Test");
	});

	it("Should instantiate and call a async command", async () => {
		vi.useFakeTimers();

		// eslint-disable-next-line @typescript-eslint/require-await
		const command = RxCommand.create<string, string>(async (param) => {
			return "RESULT + " + param;
		});

		const spy = subscribeSpyTo(command.observable);
		command("Test");

		await vi.runAllTimersAsync();

		expect(spy.getValuesLength()).toBe(1);
		expect(spy.getFirstValue()).toBe("RESULT + Test");
	});

	it("Should instantiate and call a observable command", () => {
		const command = RxCommand.create<string, string>((param) => {
			return of("RESULT + " + param);
		});

		const spy = subscribeSpyTo(command.observable);
		command("Test");

		expect(spy.getValuesLength()).toBe(1);
		expect(spy.getFirstValue()).toBe("RESULT + Test");
	});

	it("Should instantiate and call a observable that generate values", () => {
		const command = RxCommand.createNoParam<number>(() => {
			return of(1, 2, 3);
		});

		const spy = subscribeSpyTo(command.observable);
		command.execute();

		expect(spy.getValuesLength()).toBe(3);
		expect(spy.getValues()).toStrictEqual([1, 2, 3]);
	});

	it("Execute simple sync action", () => {
		const command = RxCommand.create(() => {});

		const spyCanExecute = subscribeSpyTo(command.canExecute);
		const spyIsExecuting = subscribeSpyTo(command.isExecuting);
		const spy = subscribeSpyTo(command.observable);
		const spyResult = subscribeSpyTo(command.results);

		expect(spyCanExecute.getFirstValue()).toBeTruthy();
		expect(spyIsExecuting.getFirstValue()).toBeFalsy();

		command.execute();

		expect(spy.getFirstValue()).toBeUndefined();
		expect(spyResult.getValues()).toEqual([
			new CommandResult(undefined, undefined, undefined, true),
			new CommandResult(undefined, undefined, undefined, false),
		]);

		expect(spyCanExecute.getLastValue()).toBeTruthy();
		expect(spyIsExecuting.getLastValue()).toBeFalsy();
	});

	it("Execute simple sync action with emitInitialCommandResult: true", () => {
		const command = RxCommand.create(() => {}, {
			emitInitialCommandResult: true,
		});

		const spyCanExecute = subscribeSpyTo(command.canExecute);
		const spyIsExecuting = subscribeSpyTo(command.isExecuting);
		const spy = subscribeSpyTo(command.observable);
		const spyResult = subscribeSpyTo(command.results);

		expect(spyCanExecute.getFirstValue()).toBeTruthy();
		expect(spyIsExecuting.getFirstValue()).toBeFalsy();

		command.execute();

		expect(spy.getFirstValue()).toBeUndefined();
		expect(spyResult.getValues()).toEqual([
			new CommandResult(undefined, undefined, undefined, false),
			new CommandResult(undefined, undefined, undefined, true),
			new CommandResult(undefined, undefined, undefined, false),
		]);

		expect(spyCanExecute.getLastValue()).toBeTruthy();
		expect(spyIsExecuting.getLastValue()).toBeFalsy();
	});

	it("Execute simple sync action with canExceute restriction", async () => {
		vi.useFakeTimers();

		const restriction = new BehaviorSubject<boolean>(true);
		let executionCount = 0;

		const command = RxCommand.create(
			() => {
				executionCount++;
			},
			{ restriction: restriction },
		);

		const spyCanExecute = subscribeSpyTo(command.canExecute);
		const spyIsExecuting = subscribeSpyTo(command.isExecuting);
		const spy = subscribeSpyTo(command.observable);
		const spyResult = subscribeSpyTo(command.results);

		expect(spyCanExecute.getFirstValue()).toBeTruthy();
		expect(spyIsExecuting.getFirstValue()).toBeFalsy();

		command.execute();

		expect(spy.getFirstValue()).toBeUndefined();
		expect(spyResult.getValues()).toEqual([
			new CommandResult(undefined, undefined, undefined, true),
			new CommandResult(undefined, undefined, undefined, false),
		]);

		expect(executionCount).toBe(1);

		expect(spyCanExecute.getLastValue()).toBeTruthy();
		expect(spyIsExecuting.getLastValue()).toBeFalsy();

		restriction.next(false);

		// yield execution so the restriction emits before the command.canExecute is checked.
		await vi.runAllTimersAsync();

		expect(spyCanExecute.getLastValue()).toBeFalsy();
		expect(spyIsExecuting.getLastValue()).toBeFalsy();

		command.execute();

		expect(executionCount).toBe(1);

		restriction.complete();
	});

	it("Execute simple sync action with parameter", () => {
		let param = "";
		const command = RxCommand.create<string>((x) => {
			param = x;
		});

		const spyCanExecute = subscribeSpyTo(command.canExecute);
		const spyIsExecuting = subscribeSpyTo(command.isExecuting);
		const spy = subscribeSpyTo(command.observable);
		const spyResult = subscribeSpyTo(command.results);

		expect(spyCanExecute.getFirstValue()).toBeTruthy();
		expect(spyIsExecuting.getFirstValue()).toBeFalsy();

		command.execute("PARAM");

		expect(spy.getFirstValue()).toBeUndefined();
		expect(spyResult.getValues()).toEqual([
			new CommandResult("PARAM", undefined, undefined, true),
			new CommandResult("PARAM", undefined, undefined, false),
		]);

		expect(spyCanExecute.getLastValue()).toBeTruthy();
		expect(spyIsExecuting.getLastValue()).toBeFalsy();
		expect(param).toBe("PARAM");
	});

	it("Execute async function called twice only once", async () => {
		let executionCount = 0;
		const command = RxCommand.create<string>(async (s) => {
			executionCount++;
			await delay(100);
			return s;
		});

		const spyCanExecute = subscribeSpyTo(command.canExecute);
		const spyIsExecuting = subscribeSpyTo(command.isExecuting);
		const spyResult = subscribeSpyTo(command.results);

		expect(spyCanExecute.getFirstValue()).toBeTruthy();
		expect(spyIsExecuting.getFirstValue()).toBeFalsy();

		command.execute("Done");
		await delay(50);
		command.execute("Done");
		await delay(50);

		expect(spyResult.getValues()).toEqual([
			new CommandResult("Done", undefined, undefined, true),
			new CommandResult("Done", "Done", undefined, false),
		]);

		expect(spyCanExecute.getValues()).toStrictEqual([true, false, true]);
		expect(spyIsExecuting.getValues()).toStrictEqual([false, true, false]);
		expect(executionCount).toBe(1);
	});
});
