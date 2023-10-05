import { SchemaBase, registerType } from "../schema"

export type Duration = number

export type DurationFactory = { factoryCreate(): Duration }
export const Duration: DurationFactory = {
	factoryCreate() {
		return 0
	},
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
