import {
	SchemaBaseOptions,
	Schema,
	Enumable,
	S,
	isSchemaType,
	defineSchemaComparison,
	defineSchemaType,
} from "./schema-base"

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
		Toggle: SchemaMapping<SchemaToggle, Toggle>
	}
}

S.Toggle = (options) => {
	return {
		type: "Toggle",
		...options,
	}
}

defineSchemaType<SchemaToggle>({
	type: "Toggle",
	name: "Toggle",
	color: "#000000",
	icon: "mdi mdi-swap",
	traits: {
		canBeVariable: true,
		canBeViewerVariable: false,
		canBeCommandArg: true,
	},
	factory() {
		return false
	},
})

defineSchemaComparison("Toggle", "Toggle", {
	equality(lhs, rhs) {
		return lhs == rhs
	},
})
