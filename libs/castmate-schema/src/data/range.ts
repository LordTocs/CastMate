import { isNumber } from "lodash"
import { registerType, Schema, SchemaBase } from "../schema"

// interface Range {
// 	min?: number
// 	max?: number
// 	inRange(num: number): boolean
// }

export class Range {
	min?: number | string
	max?: number | string

	constructor(min?: number, max?: number) {
		this.min = min
		this.max = max
	}

	inRange(num: number) {
		if (!isNumber(this.min) || !isNumber(this.max)) return false

		if (this.min != null) {
			if (this.min > num) {
				return false
			}
		}

		if (this.max != null) {
			if (this.max < num) {
				return false
			}
		}

		return true
	}

	toJSON() {
		return {
			min: this.min,
			max: this.max,
		}
	}
}

export interface SchemaRange {
	type: typeof Range
	template?: boolean
}

declare module "../schema" {
	interface SchemaTypeMap {
		Range: [SchemaRange, Range]
	}
}

function test<T extends Schema>(s: T) {}

test({
	type: Object,
	properties: {
		hello: { type: Range },
	},
})

registerType("Range", {
	constructor: Range,
})
