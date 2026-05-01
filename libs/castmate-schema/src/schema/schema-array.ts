import { S, Schema, SchemaBaseOptions, SchemaBase, defineSchemaType, getSchemaTypeName } from "./schema-base"
import { ExpressedSchemaType, SchemaType } from "./schema-typing"

export interface SchemaArrayOptions<TItem extends Schema> extends SchemaBaseOptions {
	maxLength?: number
}

export interface SchemaArray<TItem extends Schema = Schema> extends SchemaBase<"Array">, SchemaArrayOptions<TItem> {
	items: TItem
}

export type ExpressedSchemaArrayType<
	TArray extends SchemaArray<Schema>,
	Result extends unknown[] = ExpressedSchemaType<TArray["items"]>[]
> = Result

export type SchemaArrayType<
	TArray extends SchemaArray<Schema>,
	Result extends unknown[] = SchemaType<TArray["items"]>[]
> = Result

declare module "./schema-base" {
	namespace S {
		function Array<TItem extends Schema>(items: TItem, options?: SchemaArrayOptions<TItem>): SchemaArray<TItem>
	}

	interface SchemaTypeMap {
		Array: SchemaMapping<SchemaArray, []>
	}
}

defineSchemaType<SchemaArray>({
	type: "Array",
	name(schema) {
		return `${getSchemaTypeName(schema.items)} Array`
	},
	traits: {},
	color: "#000000",
	icon: "mdi mdi-array",
	async constructDefault(schema) {
		return [] as SchemaType<typeof schema>
	},
})

S.Array = <TItem extends Schema>(items: TItem, options?: SchemaArrayOptions<TItem>) => {
	return {
		type: "Array",
		items,
		...options,
	}
}
