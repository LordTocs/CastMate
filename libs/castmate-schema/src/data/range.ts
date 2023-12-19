import { isNumber } from "lodash"
import { registerType, Schema, SchemaBase } from "../schema"

export interface Range {
	min?: number | string
	max?: number | string
}

export interface RangeFactory {
	factoryCreate(): Range
	inRange(range: Range, num: number): boolean
}
export const Range: RangeFactory = {
	factoryCreate(): Range {
		return {}
	},

	inRange(range: Range | undefined, num: number) {
		if (!range) return true //Empty range is considered all numbers
		if (!isNumber(range.min) || !isNumber(range.max)) return false

		if (range.min != null) {
			if (range.min > num) {
				return false
			}
		}

		if (range.max != null) {
			if (range.max < num) {
				return false
			}
		}
		return true
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
