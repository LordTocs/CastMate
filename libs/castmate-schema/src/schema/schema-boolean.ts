import { ExpressionNode } from "../expression/expression"
import {
	SchemaBaseOptions,
	Schema,
	Enumable,
	S,
	isSchemaType,
	defineSchemaComparison,
	defineSchemaType,
	getDefault,
	Defaultable,
	getJSEquality,
} from "./schema-base"
import { SchemaType } from "./schema-typing"

export interface SchemaBooleanOptions extends SchemaBaseOptions, Defaultable<boolean> {}
export interface SchemaBoolean extends Schema, SchemaBooleanOptions {
	type: "Boolean"
}

export function isBooleanSchema(schema: unknown): schema is SchemaBoolean {
	return isSchemaType(schema, "Boolean")
}

declare module "./schema-base" {
	namespace S {
		function Boolean(options?: SchemaBooleanOptions): SchemaBoolean
	}

	interface SchemaTypeMap {
		Boolean: SchemaMapping<SchemaBoolean, boolean>
	}
}

S.Boolean = (options) => {
	return {
		type: "Boolean",
		...options,
	}
}

defineSchemaType<SchemaBoolean>({
	type: "Boolean",
	name: "Boolean",
	color: "#000000",
	icon: "mdi mdi-switch",
	traits: {
		canBeVariable: true,
		canBeViewerVariable: true,
	},
	async constructDefault(schema) {
		return ((await getDefault(schema)) ?? false) as SchemaType<typeof schema>
	},
})

defineSchemaComparison("Boolean", "Boolean", getJSEquality())
