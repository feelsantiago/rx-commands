import { Observable } from "rxjs";

export type Action<TParam = void, TResult = void> = (param: TParam) => TResult;
export type AsyncAction<TParam = void, TResult = void> = (
	param: TParam,
) => Promise<TResult>;
export type ObservableAction<TParam = void, TResult = void> = (
	param: TParam,
) => Observable<TResult>;

/**
 * if you want to get an initial Result with `data==null, error==null, isExecuting==false` pass
 * [emitInitialCommandResult=true].
 * [emitLastResult] will include the value of the last successful execution in all [CommandResult] events unless there is no result.
 * By default the [results] Observable and the [RxCommand] itself behave like a Subject. If you want that it acts like
 * a BehaviourSubject, meaning every listener gets the last received value, you can set [emitsLastValueToNewSubscriptions = true].
 * [initialLastResult] sets the value of the [lastResult] property before the first item was received. This is helpful if you use
 * [lastResult] as `initialData` of a `StreamBuilder`
 * [debugName] optional identifier that is included when you register a [globalExceptionHandler]
 * or a [loggingHandler]
 */
export interface RxCommandOptions<TResult = void> {
	restriction?: Observable<boolean>;
	emitInitialCommandResult?: boolean;
	emitLastResult?: boolean;
	emitsLastValueToNewSubscriptions?: boolean;
	result?: TResult;
	debugName?: string;
}
