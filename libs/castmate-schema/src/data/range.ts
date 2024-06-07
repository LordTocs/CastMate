import { isNumber } from "lodash"
import { registerType, Schema, SchemaBase } from "../schema"

export interface TemplateRange {
	min?: number | string
	max?: number | string
}

export interface Range {
	min?: number
	max?: number
}

export const Range = {
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

	random(range: Range) {
		const r = Math.random()

		const min = range.min ?? 0

		const max = range.max ?? Math.max(1, min)

		return min + (max - min) * r
	},
}

export type RangeFactory = typeof Range

export interface SchemaRange extends SchemaBase<Range> {
	type: RangeFactory
	template?: boolean
}

declare module "../schema" {
	interface SchemaTypeMap {
		Range: [SchemaRange, Range]
	}

	interface TemplateSchemaTypeMap {
		Range: [SchemaRange, TemplateRange]
	}
}

registerType("Range", {
	constructor: Range,
})
