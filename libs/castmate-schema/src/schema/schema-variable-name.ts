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

export interface SchemaVariableNameOptions extends SchemaBaseOptions, Defaultable<string> {
	maxLength?: number
}

export interface SchemaVariableName extends Schema, SchemaVariableNameOptions {
	type: "VariableName"
}

export function isVariableNameSchema(schema: unknown): schema is SchemaVariableName {
	return isSchemaType(schema, "VariableName")
}

declare module "./schema-base" {
	namespace S {
		function VariableName(options?: SchemaVariableNameOptions): SchemaVariableName
	}

	interface SchemaTypeMap {
		VariableName: SchemaMapping<SchemaVariableName, string>
	}
}

S.VariableName = (options) => {
	return {
		type: "VariableName",
		...options,
	}
}

defineSchemaType<SchemaVariableName>({
	type: "VariableName",
	name: "VariableName",
	color: "#000000",
	icon: "mdi mdi-text-short",
	traits: {
		canBeVariable: false,
		canBeViewerVariable: false,
		canBeCommandArg: false,
	},
	async constructDefault(schema) {
		return ((await getDefault(schema)) ?? "") as SchemaType<typeof schema>
	},
})

defineSchemaComparison("VariableName", "VariableName")
defineSchemaComparison("VariableName", "String")
defineSchemaComparison("String", "VariableName")
