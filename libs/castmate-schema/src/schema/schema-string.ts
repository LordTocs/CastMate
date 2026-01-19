import { ExpressionNode } from "../expression/expression"
import { SchemaBaseOptions, Schema, Enumable, S, isSchemaType, defineSchemaComparison } from "./schema-base"

export interface SchemaStringOptions extends SchemaBaseOptions, Enumable<string> {
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

defineSchemaComparison("String", "String")
