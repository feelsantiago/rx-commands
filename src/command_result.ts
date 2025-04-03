/**
 * Combined execution state of an `RxCommand`
 * Will be issued for any state change of any of the fields
 * During normal command execution you will get this items listening at the command's [.results] observable.
 * 1. If the command was just newly created you will get `null, null, false` (data, error, isExecuting)
 * 2. When calling execute: `null, null, true`
 * 3. When execution finishes: `the result, null, false`
 * 3. When execution finishes: `param data, the result, null, false`
 *`param data` is the data that you pass as parameter when calling the command
 */
export class CommandResult<TParam = void, TResult = void> {
	constructor(
		public readonly param: TParam | undefined,
		public readonly data: TResult | undefined,
		public readonly error: Error | undefined,
		public readonly isExecuting: boolean,
	) {}

	public static data<TParam = void, TResult = void>(
		param: TParam | undefined,
		result: TResult,
	): CommandResult<TParam, TResult> {
		return new CommandResult(param, result, undefined, false);
	}

	public static error<TParam = void, TResult = void>(
		param: TParam | undefined,
		error: Error,
	): CommandResult<TParam, TResult> {
		return new CommandResult<TParam, TResult>(param, undefined, error, false);
	}

	public static loading<TParam = void, TResult = void>(
		param?: TParam,
	): CommandResult<TParam, TResult> {
		return new CommandResult<TParam, TResult>(
			param,
			undefined,
			undefined,
			true,
		);
	}

	public static blank<TParam = void, TResult = void>(): CommandResult<
		TParam,
		TResult
	> {
		return new CommandResult<TParam, TResult>(
			undefined,
			undefined,
			undefined,
			false,
		);
	}

	public get hasData(): boolean {
		return this.data !== undefined;
	}

	public get hasError(): boolean {
		return this.error !== undefined;
	}

	public equals(other: CommandResult<TParam, TResult>): boolean {
		return (
			this.param === other.param &&
			this.data === other.data &&
			this.error === other.error &&
			this.isExecuting === other.isExecuting
		);
	}

	public toString(): string {
		return `ParamData ${this.param} - Data ${this.data} - HasError - ${this.hasError} - IsExecuting - ${this.isExecuting}`;
	}
}
