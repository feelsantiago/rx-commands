import {
	BehaviorSubject,
	distinct,
	filter,
	from,
	lastValueFrom,
	merge,
	Observable,
	Observer,
	of,
	ReplaySubject,
	Subject,
	Subscribable,
	Subscription,
	switchMap,
	take,
	tap,
	Unsubscribable,
} from "rxjs";
import { match, P } from "ts-pattern";
import { CommandResult } from "./command_result.js";
import { CommandError } from "./command_error.js";
import {
	Action,
	AsyncAction,
	ObservableAction,
	RxCommandOptions,
} from "./types.js";

const DEFAULT_OPTIONS: RxCommandOptions = {
	emitInitialCommandResult: false,
	emitLastResult: false,
	emitsLastValueToNewSubscriptions: false,
};

/**
 * [RxCommand] capsules a given handler function that can then be executed by its [execute] method.
 * The result of this method is then published through its Observable (Observable wrap Dart Streams)
 * Additionally it offers Observables for it's current execution state, if the command can be executed and for
 * all possibly thrown exceptions during command execution.
 *
 * [RxCommand] implements the `Observable` interface so you can listen directly to the [RxCommand] which emits the
 * results of the wrapped function. If this function has a [void] return type
 * it will still output one `void` item so that you can listen for the end of the execution.
 *
 * The [results] Observable emits [CommandResult<TRESULT>] which is often easier in combination with Flutter `StreamBuilder`
 * because you have all state information at one place.
 *
 * An [RxCommand] is a generic class of type [RxCommand<TParam, TRESULT>]
 * where [TParam] is the type of data that is passed when calling [execute] and
 * [TResult] denotes the return type of the handler function. To signal that
 * a handler doesn't take a parameter or returns no value use the type `void`
 */
export class RxCommand<TParam = void, TResult = void>
	extends Function
	implements Subscribable<TResult>
{
	/**
	 * The result of the last successful call to execute. This is especially handy to use as `initialData` of Flutter `StreamBuilder`
	 * */
	public lastResult?: TResult;

	private _running = false;
	private _canExecut = true;
	private _executionLocked = false;

	private readonly _commandResultsSubject!: Subject<
		CommandResult<TParam, TResult>
	>;
	private readonly _isExecutingSubject = new BehaviorSubject(false);
	private readonly _canExecuteSubject = new BehaviorSubject(false);
	private readonly _thrownExceptionsSubject = new Subject<
		CommandError<TParam>
	>();
	private readonly _subscriptions = new Subscription();

	private set _sink(subscription: Subscription) {
		this._subscriptions.add(subscription);
	}

	public get observable(): Observable<TResult> {
		return this._resultsSubject;
	}

	public get results(): Observable<CommandResult<TParam, TResult>> {
		return this._commandResultsSubject;
	}

	public get isExecuting(): Observable<boolean> {
		return this._isExecutingSubject;
	}

	public get canExecute(): Observable<boolean> {
		return this._canExecuteSubject;
	}

	public get thrownExceptions(): Observable<CommandError<TParam>> {
		return this._thrownExceptionsSubject;
	}

	public get next(): Promise<TResult | CommandError<TParam>> {
		const observable = merge(this._resultsSubject, this.thrownExceptions).pipe(
			take(1),
		);

		return lastValueFrom(observable);
	}

	/**
	 * optional hander that will get called on any exception that happens inside
	 * any Command of the app. Ideal for logging. [commandName]
	 * the [debugName] of the Command
	 */
	public static globalExceptionHandler?: (
		commandName?: string,
		error?: CommandError<unknown>,
	) => void;

	/**
	 * optional handler that will get called on all `Command` executions. [commandName]
	 * the [debugName] of the Command
	 */
	public static loggingHandler?: (
		commandName?: string,
		result?: CommandResult<unknown, unknown>,
	) => void;

	private constructor(
		private readonly _action:
			| Action<TParam, TResult>
			| AsyncAction<TParam, TResult>
			| ObservableAction<TParam, TResult>,
		private readonly _resultsSubject: Subject<TResult>,
		private readonly _restriction: Observable<boolean> | undefined,
		private readonly _includeLastResultInCommandResults: boolean,
		private readonly _resultSubjectIsBehaviourSubject: boolean,
		private readonly _emitInitialCommandResult: boolean,
		private readonly _debugName: string | undefined,
		lastResult?: TResult,
	) {
		super("return arguments.callee._call.apply(arguments.callee, arguments)");

		this._commandResultsSubject = this._resultSubjectIsBehaviourSubject
			? new ReplaySubject<CommandResult<TParam, TResult>>(1)
			: new Subject<CommandResult<TParam, TResult>>();

		this.lastResult = lastResult;

		this._sink = this._commandResultsSubject
			.pipe(filter((x) => x.hasError))
			.subscribe((x) =>
				this._thrownExceptionsSubject.next(new CommandError(x.param, x.error)),
			);

		this._sink = this._commandResultsSubject.subscribe((x) =>
			this._isExecutingSubject.next(x.isExecuting),
		);

		const _canExecuteParam =
			this._restriction == undefined
				? of(true)
				: this._restriction.pipe(
						tap({
							error: (error) => {
								if (error instanceof Error) {
									this._thrownExceptionsSubject.next(
										new CommandError<TParam>(undefined, error),
									);
								}
							},
						}),
						distinct(),
					);

		this._sink = _canExecuteParam.subscribe((canExecute) => {
			this._canExecut = canExecute && !this._running;
			this._executionLocked = !canExecute;
			this._canExecuteSubject.next(this._canExecut);
		});

		if (this._emitInitialCommandResult) {
			this._commandResultsSubject.next(
				new CommandResult<TParam, TResult>(
					undefined,
					this.lastResult,
					undefined,
					false,
				),
			);
		}
	}

	public static create<TParam = void, TResult = void>(
		action:
			| Action<TParam, TResult>
			| AsyncAction<TParam, TResult>
			| ObservableAction<TParam, TResult>,
		options?: RxCommandOptions<TResult>,
	): RxCommand<TParam, TResult> {
		const config = { ...DEFAULT_OPTIONS, ...options };

		const subject =
			config.emitsLastValueToNewSubscriptions || config.emitInitialCommandResult
				? new ReplaySubject<TResult>(1)
				: new Subject<TResult>();

		return new RxCommand<TParam, TResult>(
			action,
			subject,
			config.restriction,
			config.emitLastResult!,
			config.emitsLastValueToNewSubscriptions! ||
				config.emitInitialCommandResult!,
			config.emitInitialCommandResult!,
			config.debugName,
			config.result as TResult,
		);
	}

	public subscribe(
		observer:
			| Partial<Observer<TResult>>
			| ((value: TResult) => void)
			| undefined,
	): Unsubscribable {
		return this._resultsSubject.subscribe(observer);
	}

	public _call(...args: TParam[]) {
		return this.execute(args[0]);
	}

	public execute(param: TParam): void {
		if (!this._canExecut || this._running) {
			return;
		}

		this._running = true;
		this._canExecuteSubject.next(false);

		this._commandResultsSubject.next(
			new CommandResult<TParam, TResult>(
				param,
				this._includeLastResultInCommandResults ? this.lastResult : undefined,
				undefined,
				true,
			),
		);

		this._sink = of(true)
			.pipe(
				switchMap(() => {
					const data = this._action(param);
					return match(data)
						.returnType<Observable<TResult>>()
						.with(P.instanceOf(Promise), () => from(data as Promise<TResult>))
						.with(P.instanceOf(Observable), () => data as Observable<TResult>)
						.otherwise(() => of(data as TResult));
				}),
			)
			.subscribe({
				next: (data) => {
					const result = new CommandResult<TParam, TResult>(
						param,
						data,
						undefined,
						false,
					);

					this._resultsSubject.next(data);
					this._commandResultsSubject.next(result);
					this._logger(result);
				},
				error: (error) => {
					if (error instanceof Error) {
						const result = new CommandResult<TParam, TResult>(
							param,
							this._includeLastResultInCommandResults
								? this.lastResult
								: undefined,
							error,
							false,
						);

						this._commandResultsSubject.next(result);

						this._debug(param, error);
						this._logger(result);
					}
				},
				complete: () => {
					this._running = false;
					this._canExecut = !this._executionLocked;
					this._canExecuteSubject.next(!this._executionLocked);
				},
			});
	}

	public dispose() {
		this._commandResultsSubject.complete();
		this._isExecutingSubject.complete();
		this._canExecuteSubject.complete();
		this._thrownExceptionsSubject.complete();
		this._resultsSubject.complete();
		this._subscriptions.unsubscribe();
	}

	private _logger(result: CommandResult<TParam, TResult>): void {
		if (RxCommand.loggingHandler != undefined) {
			RxCommand.loggingHandler(this._debugName, result);
		}
	}

	private _debug(param: TParam, error: Error): void {
		if (RxCommand.globalExceptionHandler != null) {
			RxCommand.globalExceptionHandler(
				this._debugName,
				new CommandError(param, error),
			);
		}
	}
}
