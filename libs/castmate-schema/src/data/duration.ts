import { SchemaBase, registerType } from "../schema"

export type Duration = number

export type DurationFactory = { factoryCreate(): Duration; foobar(): void }
export const Duration: DurationFactory = {
	factoryCreate() {
		return 0 as Duration
	},
	foobar() {},
}

export interface SchemaDuration extends SchemaBase<Duration> {
	type: DurationFactory
	template?: boolean
	//max?
	//min?
}

declare module "../schema" {
	interface SchemaTypeMap {
		Duration: [SchemaDuration, Duration]
	}
}

registerType("Duration", {
	constructor: Duration,
})
