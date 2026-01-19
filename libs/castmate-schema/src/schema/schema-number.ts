import { S, Enumable, Schema, SchemaBaseOptions, defineSchemaComparison } from "./schema-base"

export interface SchemaNumberOptions extends SchemaBaseOptions, Enumable<number> {
	min?: number
	max?: number
	step?: number
	slider?: boolean
	unit?: string
}

export interface SchemaNumber extends Schema, SchemaNumberOptions {
	type: "Number"
}

export function isNumberSchema(schema: unknown): schema is SchemaNumber {
	if (!schema) return false
	if (typeof schema != "object") return false
	if (!("type" in schema)) return false
	if (schema.type != "Number") return false
	return true
}

declare module "./schema-base" {
	namespace S {
		function Number(options?: SchemaNumberOptions): SchemaNumber
	}

	interface SchemaTypeMap {
		Number: SchemaMapping<SchemaNumber, number>
	}
}

S.Number = (options) => {
	return {
		type: "Number",
		...options,
	}
}

defineSchemaComparison("Number", "Number")
