import {
	S,
	isSchemaType,
	SchemaBaseOptions,
	Schema,
	defineSchemaType,
	getSchemaTypeName,
	Defaultable,
	getDefault,
} from "../schema/schema-base"
import { SchemaType, ExpressedSchemaType } from "../schema/schema-typing"

export interface SchemaRangeOptions extends SchemaBaseOptions {}

export interface SchemaRange<TLimit extends Schema = Schema> extends Defaultable<Range<SchemaType<TLimit>>> {
	type: "Range"
	limit: TLimit
}

export function isRangeSchema(schema: unknown): schema is SchemaRange {
	return isSchemaType(schema, "Range")
}

export interface Range<T> {
	min?: T
	max?: T
}

export const Range = {
	inRange<TLimit extends Schema>(
		value: SchemaType<TLimit>,
		range: Range<SchemaType<TLimit>>,
		schema: TLimit
	): boolean {
		//TODO: Use Schema Comparison
		return false
	},
}

export type ExpressedSchemaRangeType<
	TRange extends SchemaRange,
	Result extends unknown = Range<ExpressedSchemaType<TRange["limit"]>>
> = Result

export type SchemaRangeType<
	TRange extends SchemaRange,
	Result extends unknown = Range<SchemaType<TRange["limit"]>>
> = Result

declare module "../schema/schema-base" {
	namespace S {
		function Range<TLimit extends Schema>(limit: TLimit, options?: SchemaRangeOptions): SchemaRange<TLimit>
	}
}

defineSchemaType<SchemaRange>({
	type: "Range",
	name(schema) {
		//@ts-ignore
		const innerName = getSchemaTypeName(schema.limit)
		return `${innerName} Range`
	},
	color: "#000000",
	icon: "mdi mdi-range",
	traits: {
		canBeVariable: true,
	},
	async constructDefault(schema) {
		return ((await getDefault(schema)) ?? {}) as SchemaType<typeof schema>
	},
})

S.Range = <TLimit extends Schema>(limit: TLimit, options?: SchemaRangeOptions) => {
	return {
		type: "Range",
		limit,
		...options,
	}
}
