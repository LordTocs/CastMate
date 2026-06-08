import { Defaultable, SchemaBaseOptions, Schema, S, defineSchemaType, getDefault } from "../schema/schema-base"
import { SchemaType } from "../schema/schema-typing"

export type Duration = number

export type DurationFactory = { factoryCreate(): Duration; foobar(): void }
export const Duration: DurationFactory = {
	factoryCreate() {
		return 0 as Duration
	},
	foobar() {},
}

export interface SchemaDurationOptions extends SchemaBaseOptions {
	min?: Duration
	max?: Duration
}

export interface SchemaDuration extends Schema, SchemaDurationOptions, Defaultable<Duration> {
	type: "Duration"
}

declare module "../schema/schema-base" {
	namespace S {
		function Duration(options?: SchemaDuration): SchemaDuration
	}

	interface SchemaTypeMap {
		Duration: SchemaMapping<SchemaDuration, Duration>
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

const HOUR_DUR = 60 * 60
const MINUTE_DUR = 60

export interface DurationParts {
	sign?: number
	hours?: number
	minutes?: number
	seconds?: number
}

export function parseDurationParts(duration: Duration | undefined): DurationParts {
	if (duration == null) {
		return {}
	}

	const result: DurationParts = {}

	result.sign = Math.sign(duration)

	let remaining = Math.abs(duration)
	if (remaining >= HOUR_DUR) {
		result.hours = Math.floor(remaining / HOUR_DUR)
		remaining = remaining % HOUR_DUR
	}
	if (remaining >= MINUTE_DUR) {
		result.minutes = Math.floor(remaining / MINUTE_DUR)
		remaining = remaining % MINUTE_DUR
	}
	result.seconds = remaining

	return result
}

export function formatDuration(duration: Duration | undefined, decimalPlaces: number = 4) {
	if (duration == null) {
		return ""
	}

	const parts = parseDurationParts(duration)

	let result = ""

	if (parts.sign != null && parts.sign < 0) {
		result += "-"
	}

	if (parts.hours != null) {
		result += parts.hours + "h "

		result +=
			(parts.minutes ?? 0).toLocaleString("en-Us", {
				minimumIntegerDigits: 2,
				useGrouping: false,
			}) + "m "

		result +=
			(parts.seconds ?? 0).toLocaleString("en-Us", {
				minimumIntegerDigits: 2,
				maximumFractionDigits: decimalPlaces,
				useGrouping: false,
			}) + "s"
	} else if (parts.minutes != null) {
		result += parts.minutes + "m "

		result +=
			(parts.seconds ?? 0).toLocaleString("en-Us", {
				minimumIntegerDigits: 2,
				maximumFractionDigits: decimalPlaces,
				useGrouping: false,
			}) + "s"
	} else if (parts.seconds != null) {
		result +=
			parts.seconds.toLocaleString("en-Us", {
				maximumFractionDigits: decimalPlaces,
				useGrouping: false,
			}) + "s"
	}

	return result
}
