<h1 align="center">Rx Commands</h1>

<p align="center">Reactive Command Pattern Implementation</p>

<p align="center">
	<!-- prettier-ignore-start -->
	<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
	<a href="#contributors" target="_blank"><img alt="👪 All Contributors: 1" src="https://img.shields.io/badge/%F0%9F%91%AA_all_contributors-1-21bb42.svg" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
	<!-- prettier-ignore-end -->
	<a href="https://github.com/feelsantiago/rx-commands/blob/main/.github/CODE_OF_CONDUCT.md" target="_blank"><img alt="🤝 Code of Conduct: Kept" src="https://img.shields.io/badge/%F0%9F%A4%9D_code_of_conduct-kept-21bb42" /></a>
	<a href="https://codecov.io/gh/feelsantiago/rx-commands" target="_blank"><img alt="🧪 Coverage" src="https://img.shields.io/codecov/c/github/feelsantiago/rx-commands?label=%F0%9F%A7%AA%20coverage" /></a>
	<a href="https://github.com/feelsantiago/rx-commands/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/rx-commands" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/rx-commands?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

`RxCommand` is an [_Reactive Extensions_ (Rx)](http://reactivex.io/) based abstraction for event handlers. It is based on `ReactiveCommand` for the [ReactiveUI](https://reactiveui.net/) framework and [RxCommand Flutter Package](https://pub.dev/packages/rx_command).

`RxCommand` capsules a given handler function that can then be executed by its `execute` method or directly call because it's a callable class. The result of this method is then published through its Observable interface. Additionally it offers Observables for it's current execution state, if the command can be executed and for all possibly thrown exceptions during command execution.

```ts
const command = RxCommand.create<int, string>((myInt) => "$myInt");

command.subscribe((s) => print(s)); // Setup the listener that now waits for events, not doing anything

// Somwhere else
command.execute(10); // the listener will print "10"

// or
command(10);
```

## Usage

```shell
npm i rx-commands

```

An `RxCommand` is a generic class of type `RxCommand<TParam = void, TResult = void>` where `TParam` is the type of data that is passed when calling `execute` and `TResult` denotes the return type of the handler function. To signal that a handler doesn't take a parameter or returns a `null` value use `void` as type.
Even if you create a `RxCommand<void,void>` you will receive a `null` value when the wrapped function finishes so you can listen for the successful completion.

An example of the declaration

```ts
RxCommand < string, List < WeatherEntry >> updateWeatherCommand;
RxCommand < bool, bool > switchChangedCommand;
```

- `updateWeatherCommand` expects a handler that takes a `string` as parameter and returns a `List<WeatherEntry>`.
- `switchChangedCommand` expects and returns a `bool` value.

### Creating RxCommands

You can create commands that are sync, async (returns promises) or from observables.

```ts
const commandSync = RxCommand.create((myInt) => "$myInt");
const commandNoResult = RxCommand.create<void>(() => {
	// Do Something
});
const commandNoParam = RxCommand.createNoParam<number>(() => {
	return 1;
});
const commandNoParamNoReturn = RxCommand.create<void, void>(() => {
	// Do something
});
const commandAsync = RxCommand.create(async () => {
	// do async
});
const commandFromObservable = RxCommand.create(() => of(1, 2, 3));
```

### Options

```ts
const command = RxCommand.create(() => {
    throw new Error("Something went wrong");
}, {
	restriction?: Observable<boolean>;
	emitInitialCommandResult?: boolean;
	emitLastResult?: boolean;
	emitsLastValueToNewSubscriptions?: boolean;
	initialLastResult?: TResult;
	debugName?: string;
});
```

| Option                           | Description                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| restriction                      | An observable that will determine if the command can be executed.                                                |
| emitInitialCommandResult         | Emit the result of the command when the command is created.                                                      |
| emitsLastValueToNewSubscriptions | Use a Behavior Subject to emit values to new subscriptions                                                       |
| emitLastResult                   | Will include the value of the last successful execution in all [CommandResult] events unless there is no result. |
| initialLastResult                | sets the value of the [lastResult] property before the first item was received.                                  |

### Error handling with RxCommands

All exceptions thrown by the wrapped function will be caught and redirected to `throwExceptions` observable. If you want to react on the, you can listen on the `thrownException` property.

```ts
const command = RxCommand.create(() => {
	throw new Error("Something went wrong");
});

command.thrownExceptions.subscribe((e) => {
	console.error(e);
});
```

### Listener Sink

You can use `RxListener` class to handle observables and commands subscriptions.

```ts
import { RxListener } from 'rx-commands';

const listeners = new RxListener();
const myObservable = of(1);
const myCommnad = RxCommand.create(() => 1);


listeners.sink = myObservable.subscribe(...);
listeners.sink = myCommand;

// add more than one at time
listeners.add([subscription1, subscription2, command1, command2]);

// Will close all subscriptions and commands
listeners.dispose();
```

`RxListener` will subscribe to command `thrownExceptions` observable and log all errors to `console.error`. You can disable this behavior gloabaly by setting `RxListener.canLogCommandExceptions = false;`

```ts
RxListener.canLogCommandExceptions = false;
```

## Development

See [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md), then [`.github/DEVELOPMENT.md`](./.github/DEVELOPMENT.md).
Thanks! 💖

## Contributors

<!-- spellchecker: disable -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><img src="https://avatars.githubusercontent.com/u/18483175?v=4?s=100" width="100px;" alt="Filipe Santiago"/><br /><sub><b>Filipe Santiago</b></sub><br /><a href="https://github.com/feelsantiago/rx-commands/commits?author=feelsantiago" title="Code">💻</a> <a href="#content-feelsantiago" title="Content">🖋</a> <a href="https://github.com/feelsantiago/rx-commands/commits?author=feelsantiago" title="Documentation">📖</a> <a href="#ideas-feelsantiago" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-feelsantiago" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-feelsantiago" title="Maintenance">🚧</a> <a href="#projectManagement-feelsantiago" title="Project Management">📆</a> <a href="#tool-feelsantiago" title="Tools">🔧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- spellchecker: enable -->

<!-- You can remove this notice if you don't want it 🙂 no worries! -->

> 💝 This package was templated with [`create-typescript-app`](https://github.com/JoshuaKGoldberg/create-typescript-app) using the [Bingo engine](https://create.bingo).
