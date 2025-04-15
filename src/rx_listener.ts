/* eslint-disable @typescript-eslint/no-explicit-any */
import { match, P } from "ts-pattern";
import { filter, Subscription } from "rxjs";
import { RxCommand } from "./rx_commands.js";

/**
 * [RxListener] can be used to hold subscriptions to [RxCommand]s and Observables.
 * When a [RxListener] is disposed all subscriptions will be unsubscribed
 *
 * When a [RxCommand] subscription is added, [RxListener] will automatically subscribe to command `thrownExceptions` observable and will log errors to the `console.error`. This behavior is configurable.
 */
export class RxListener {
	private _listners = new Subscription();
	private _commands: RxCommand[] = [];

	/**
	 * Global handle to enable/disable logging of [RxCommand] errors
	 */
	public static listenToCommandExceptions = true;

	public set sink(reference: Subscription | RxCommand<any, any>) {
		this.add([reference]);
	}

	public add(references: (Subscription | RxCommand<any, any>)[]): void {
		for (const reference of references) {
			// casting to unknow because of circular reference error
			// see https://github.com/gvergnaud/ts-pattern/issues/315
			match(reference as any)
				.with(P.instanceOf(Subscription), (subscription) =>
					this._listners.add(subscription),
				)
				.with(P.instanceOf(RxCommand), (command) => {
					const subscription = this._listenToCommandExceptions(command);
					this._commands.push(command as RxCommand);
					this._listners.add(subscription);
				});
		}
	}

	public dispose(): void {
		this._listners.unsubscribe();

		for (const command of this._commands) {
			command.dispose();
		}

		this._listners = new Subscription();
		this._commands = [];
	}

	private _listenToCommandExceptions(
		command: RxCommand<any, any>,
	): Subscription {
		return command.thrownExceptions
			.pipe(filter(() => RxListener.listenToCommandExceptions))
			.subscribe((error) => console.error(error));
	}
}
