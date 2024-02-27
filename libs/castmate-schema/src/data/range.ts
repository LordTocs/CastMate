import { isNumber } from "lodash"
import { registerType, Schema, SchemaBase } from "../schema"

export interface Range {
	min?: number
	max?: number
}

export interface RangeFactory {
	factoryCreate(): Range
	inRange(range: Range, num: number): boolean
	clamp(range: Range | undefined, num: number): number
}
export const Range: RangeFactory = {
	factoryCreate(): Range {
		return {}
	},

	inRange(range: Range | undefined, num: number) {
		if (!range) return true //Empty range is considered all numbers
		//if (!isNumber(range.min) || !isNumber(range.max)) return false

		if (range.min != null) {
			if (!isNumber(range.min)) return false
			if (range.min > num) {
				return false
			}
		}

		if (range.max != null) {
			if (!isNumber(range.max)) return false
			if (range.max < num) {
				return false
			}
		}
		return true
	},

	clamp(range: Range | undefined, value: number) {
		if (!range) return value

		if (range.min != null) {
			if (value < range.min) {
				return range.min
			}
		}

		if (range.max != null) {
			if (value > range.max) {
				return range.max
			}
		}

		return value
	},
}

export interface SchemaRange extends SchemaBase<Range> {
	type: RangeFactory
	template?: boolean
}

declare module "../schema" {
	interface SchemaTypeMap {
		Range: [SchemaRange, Range]
	}
}

registerType("Range", {
	constructor: Range,
})
