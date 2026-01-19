import { SchemaBaseOptions, Schema, Enumable, S, isSchemaType, defineSchemaComparison } from "./schema-base"

export type Toggle = boolean | "toggle"

export interface SchemaToggleOptions extends SchemaBaseOptions, Enumable<string> {
	trueIcon?: string
	falseIcon?: string
	toggleIcon?: string
}
export interface SchemaToggle extends Schema, SchemaToggleOptions {
	type: "Toggle"
}

export function isToggleSchema(schema: unknown): schema is SchemaToggle {
	return isSchemaType(schema, "Toggle")
}
declare module "./schema-base" {
	namespace S {
		function Toggle(options?: SchemaToggleOptions): SchemaToggle
	}

	interface SchemaTypeMap {
		Toggle: SchemaMapping<SchemaToggle, string>
	}
}

S.Toggle = (options) => {
	return {
		type: "Toggle",
		...options,
	}
}

defineSchemaComparison("Toggle", "Toggle", {
	equality(lhs, rhs) {
		return lhs == rhs
	},
})
