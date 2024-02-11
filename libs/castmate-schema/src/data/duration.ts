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

const HOUR_DUR = 60 * 60
const MINUTE_DUR = 60
export function formatDuration(duration: Duration | undefined, decimalPlaces: number = 4) {
	if (duration == null) {
		return ""
	}

	let hours = 0
	let minutes = 0
	let seconds = 0

	let remaining = duration as number
	if (remaining > HOUR_DUR) {
		hours = Math.floor(remaining / HOUR_DUR)
		remaining = remaining % HOUR_DUR
	}
	if (remaining > MINUTE_DUR) {
		minutes = Math.floor(remaining / MINUTE_DUR)
		remaining = remaining % MINUTE_DUR
	}
	seconds = remaining

	let result = ""
	if (hours > 0) {
		result += hours + "h "

		result +=
			minutes.toLocaleString("en-Us", {
				minimumIntegerDigits: 2,
				useGrouping: false,
			}) + "m "

		result +=
			seconds.toLocaleString("en-Us", {
				minimumIntegerDigits: 2,
				maximumFractionDigits: decimalPlaces,
				useGrouping: false,
			}) + "s"
	} else if (minutes > 0) {
		result += minutes + "m "

		result +=
			seconds.toLocaleString("en-Us", {
				minimumIntegerDigits: 2,
				maximumFractionDigits: decimalPlaces,
				useGrouping: false,
			}) + "s"
	} else {
		result +=
			seconds.toLocaleString("en-Us", {
				maximumFractionDigits: decimalPlaces,
				useGrouping: false,
			}) + "s"
	}

	return result
}
