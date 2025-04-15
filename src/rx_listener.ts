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
	private readonly _listners = new Subscription();
	private readonly _commands: RxCommand[] = [];

	/**
	 * Global handle to enable/disable logging of [RxCommand] errors
	 */
	public static canLogCommandErrors = true;

	public set sink(reference: Subscription | RxCommand) {
		this.add([reference]);
	}

	public add(references: (Subscription | RxCommand)[]): void {
		for (const reference of references) {
			match(reference)
				.with(P.instanceOf(Subscription), (subscription) =>
					this._listners.add(subscription),
				)
				.with(P.instanceOf(RxCommand), (command) => {
					const subscription = this._listenToCommandExceptions(command);
					this._commands.push(command);
					this._listners.add(subscription);
				});
		}
	}

	public dispose(): void {
		this._listners.unsubscribe();

		for (const command of this._commands) {
			command.dispose();
		}
	}

	private _listenToCommandExceptions(command: RxCommand): Subscription {
		return command.thrownExceptions
			.pipe(filter(() => RxListener.canLogCommandErrors))
			.subscribe((error) => console.error(error));
	}
}
