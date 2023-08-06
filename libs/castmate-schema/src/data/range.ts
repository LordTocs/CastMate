import { registerType, Schema, SchemaBase } from "../schema"
import { Color } from "./color"

export class Range {
	min?: number
	max?: number

	constructor(min?: number, max?: number) {
		this.min = min
		this.max = max
	}

	inRange(num: number) {
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

type RangeConstructor = { new (min?: number, max?: number): Range }

interface SchemaRange extends SchemaBase {
	type: RangeConstructor
	template: boolean
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
