/**
 * [CommandError] wraps an occurring error together with the argument that was
 * passed when the command was called.
 * This sort of objects are emitted on the `.thrownExceptions` ValueListenable
 * of the Command
 */
export class CommandError<TParam = void> {
	public constructor(
		public readonly param: TParam | undefined,
		public readonly error: Error | undefined,
	) {}

	public equals(other: CommandError<TParam>): boolean {
		return this.param === other.param && this.error === other.error;
	}

	public toString(): string {
		return `${this.error} - for param: ${this.param}`;
	}
}
