import {
	S,
	isSchemaType,
	SchemaBaseOptions,
	Schema,
	defineSchemaType,
	getSchemaMetaData,
	getSchemaTypeName,
} from "./schema-base"
import { ResolvedSchemaType, UnresolvedSchemaType } from "./schema-typing"

export interface SchemaRangeOptions extends SchemaBaseOptions {}

export interface SchemaRange<TLimit extends Schema = Schema> {
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
		value: ResolvedSchemaType<TLimit>,
		range: Range<ResolvedSchemaType<TLimit>>,
		schema: TLimit
	): boolean {
		//TODO: Use Schema Comparison
		return false
	},
}

export type UnresolvedSchemaRangeType<
	TRange extends SchemaRange,
	Result extends unknown = Range<UnresolvedSchemaType<TRange["limit"]>>
> = Result

export type ResolvedSchemaRangeType<
	TRange extends SchemaRange,
	Result extends unknown = Range<ResolvedSchemaType<TRange["limit"]>>
> = Result

declare module "./schema-base" {
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
	factory(schema) {
		return {}
	},
})

S.Range = <TLimit extends Schema>(limit: TLimit, options: SchemaRangeOptions) => {
	return {
		type: "Range",
		limit,
		...options,
	}
}
