import { describe, expect, it, vi } from "vitest";
import { RxCommand } from "./rx_commands.js";
import { subscribeSpyTo } from "@hirez_io/observer-spy";
import { of } from "rxjs";
import { CommandResult } from "./command_result.js";

describe("RxCommand", () => {
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

	it.only("Execute simple sync action", () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const command = RxCommand.create(() => {});

		const spyCanExecute = subscribeSpyTo(command.canExecute);
		const spyIsExecuting = subscribeSpyTo(command.isExecuting);

		expect(spyCanExecute.getFirstValue()).toBeTruthy();
		expect(spyIsExecuting.getFirstValue()).toBeFalsy();

		const spy = subscribeSpyTo(command.observable);
		const spyResult = subscribeSpyTo(command.results);

		command.execute();

		expect(spy.getFirstValue()).toBeUndefined();
		expect(spyResult.getValues()).toEqual([
			new CommandResult(undefined, undefined, undefined, true),
			new CommandResult(undefined, undefined, undefined, false),
		]);

		expect(spyCanExecute.getLastValue()).toBeTruthy();
		expect(spyIsExecuting.getLastValue()).toBeFalsy();
	});
});
