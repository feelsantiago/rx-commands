/* eslint-disable @typescript-eslint/dot-notation */
import { describe, expect, it } from "vitest";
import { RxListener } from "./rx_listener.js";
import { Subject } from "rxjs";
import { RxCommand } from "./rx_commands.js";

describe("RxListener", () => {
	it("Should unsubscribe from observables", () => {
		const listener = new RxListener();
		const subject = new Subject<number>();

		listener.sink = subject.subscribe();

		subject.next(1);

		expect(subject.observed).toBeTruthy();

		listener.dispose();

		expect(subject.observed).toBeFalsy();
	});

	it("Should unsubscribe from RxCommands", () => {
		const listener = new RxListener();
		const command = RxCommand.create<number, number>((x) => x);

		listener.sink = command;

		expect(listener["_commands"].length).toBe(1);
		command.execute(1);

		listener.dispose();

		expect(listener["_commands"].length).toBe(0);
	});
});
