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
	comparisonTypes: [
		{
			otherType: Duration,
			inequalities: true,
		},
		{
			otherType: Number,
			inequalities: true,
		},
	],
})

const HOUR_DUR = 60 * 60
const MINUTE_DUR = 60

export interface DurationParts {
	hours?: number
	minutes?: number
	seconds?: number
}

export function parseDurationParts(duration: Duration | undefined): DurationParts {
	if (duration == null) {
		return {}
	}

	const result: DurationParts = {}

	let remaining = duration
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
				maximumFractionDigits: 4,
				useGrouping: false,
			}) + "s"
	}

	return result
}
