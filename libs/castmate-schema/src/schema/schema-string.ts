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
} from "./schema-base"
import { SchemaType } from "./schema-typing"

export interface SchemaStringOptions extends SchemaBaseOptions, Enumable<string>, Defaultable<string> {
	maxLength?: number
	secret?: boolean
	multiLine?: boolean
}
export interface SchemaString extends Schema, SchemaStringOptions {
	type: "String"
}

export function isStringSchema(schema: unknown): schema is SchemaString {
	return isSchemaType(schema, "String")
}

export type ExpressionString = (string | ExpressionNode)[]

declare module "./schema-base" {
	namespace S {
		function String(options?: SchemaStringOptions): SchemaString
	}

	interface SchemaTypeMap {
		String: SchemaMapping<SchemaString, string, ExpressionString>
	}
}

S.String = (options) => {
	return {
		type: "String",
		...options,
	}
}

defineSchemaType<SchemaString>({
	type: "String",
	name: "String",
	color: "#000000",
	icon: "mdi mdi-text",
	traits: {
		canBeVariable: true,
		canBeViewerVariable: true,
		canBeCommandArg: true,
	},
	async constructDefault(schema) {
		return ((await getDefault(schema)) ?? 0) as SchemaType<typeof schema>
	},
})

defineSchemaComparison("String", "String")
