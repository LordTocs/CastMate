import { SchemaType } from "./schema-typing"
import { Defaultable, Schema } from "./schema-base"
import { defineSchemaType, getDefault, isSchemaType, SchemaBaseOptions, S } from "./schema-index"

export interface SchemaAnyOptions extends SchemaBaseOptions, Defaultable<any> {}
export interface SchemaAny extends Schema, SchemaAnyOptions {
	type: "Any"
}

export function isAnySchema(schema: unknown): schema is SchemaAny {
	return isSchemaType(schema, "Any")
}

declare module "./schema-base" {
	namespace S {
		function Any(options?: SchemaAnyOptions): SchemaAny
	}

	interface SchemaTypeMap {
		Any: SchemaMapping<SchemaAny, any>
	}
}

S.Any = (options) => {
	return {
		type: "Any",
		...options,
	}
}

defineSchemaType<SchemaAny>({
	type: "Any",
	name: "Anything",
	color: "#000000",
	icon: "mdi mdi-switch",
	traits: {},
	async constructDefault(schema) {
		return ((await getDefault(schema)) ?? false) as SchemaType<typeof schema>
	},
})

//TODO: Figure out casting mechanics for comparison?
