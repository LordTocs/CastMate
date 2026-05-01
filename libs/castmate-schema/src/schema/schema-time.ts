import { Duration } from "../data/duration"
import { Timer } from "../data/timers"
import { ExpressionNode } from "../expression/expression"
import {
	SchemaBaseOptions,
	Schema,
	Enumable,
	S,
	isSchemaType,
	defineSchemaComparison,
	defineSchemaType,
	getDefault,
	Defaultable,
} from "./schema-base"
import { SchemaType } from "./schema-typing"

export interface SchemaTimerOptions extends SchemaBaseOptions {}
export interface SchemaDurationOptions extends SchemaBaseOptions {
	min?: Duration
	max?: Duration
}

export interface SchemaTimer extends Schema, SchemaTimerOptions, Defaultable<Timer> {
	type: "Timer"
}

export interface SchemaDuration extends Schema, SchemaTimerOptions, Defaultable<Duration> {
	type: "Duration"
}

export function isTimerSchema(schema: unknown): schema is SchemaTimer {
	return isSchemaType(schema, "Timer")
}

declare module "./schema-base" {
	namespace S {
		function Timer(options?: SchemaTimerOptions): SchemaTimer
		function Duration(options?: SchemaDuration): SchemaDuration
	}

	interface SchemaTypeMap {
		Timer: SchemaMapping<SchemaTimer, Timer>
		Duration: SchemaMapping<SchemaDuration, Duration>
	}
}

defineSchemaType<SchemaTimer>({
	type: "Timer",
	name: "Timer",
	color: "#000000",
	icon: "mdi mdi-timer",
	traits: {
		canBeVariable: true,
	},
	async constructDefault(schema) {
		return ((await getDefault(schema)) ?? Timer.factoryCreate()) as SchemaType<typeof schema>
	},
})

S.Timer = (options) => {
	return {
		type: "Timer",
		...options,
	}
}

defineSchemaType<SchemaDuration>({
	type: "Duration",
	name: "Duration",
	color: "#000000",
	icon: "mdi mdi-timer",
	traits: {
		canBeVariable: true,
	},
	async constructDefault(schema) {
		return ((await getDefault(schema)) ?? 0) as SchemaType<typeof schema>
	},
})

S.Duration = (options) => {
	return {
		type: "Duration",
		...options,
	}
}

//Comparisons defined on both main and render sides so they can wake up any reactive elements
