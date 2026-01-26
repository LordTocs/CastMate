import { S, Schema, SchemaBaseOptions, SchemaBase, defineSchemaType } from "./schema-base"
import { UnresolvedSchemaType, ResolvedSchemaType } from "./schema-typing"

export interface SchemaArrayOptions<TItem extends Schema> extends SchemaBaseOptions {
	maxLength?: number
}

export interface SchemaArray<TItem extends Schema = Schema> extends SchemaBase<"Array">, SchemaArrayOptions<TItem> {
	items: TItem
}

export type UnresolvedSchemaArrayType<
	TArray extends SchemaArray<Schema>,
	Result extends unknown[] = UnresolvedSchemaType<TArray["items"]>[]
> = Result

export type ResolvedSchemaArrayType<
	TArray extends SchemaArray<Schema>,
	Result extends unknown[] = ResolvedSchemaType<TArray["items"]>[]
> = Result

declare module "./schema-base" {
	namespace S {
		function Array<TItem extends Schema>(items: TItem, options?: SchemaArrayOptions<TItem>): SchemaArray<TItem>
	}
}

defineSchemaType<SchemaArray>({
	type: "Array",
	name(schema) {
		return `${getSchemaTypeName(schema.items)} Array`
	},
	color: "#000000",
	icon: "mdi mdi-array",
	factory(schema) {
		return []
	},
})

S.Array = <TItem extends Schema>(items: TItem, options?: SchemaArrayOptions<TItem>) => {
	return {
		type: "Array",
		items,
		...options,
	}
}
