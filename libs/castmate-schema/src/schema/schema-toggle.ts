import { Defaultable } from "../schema"
import {
	SchemaBaseOptions,
	Schema,
	Enumable,
	S,
	isSchemaType,
	defineSchemaComparison,
	defineSchemaType,
	getDefault,
} from "./schema-base"

import { SchemaType } from "./schema-typing"

export type Toggle = boolean | "toggle"

export interface SchemaToggleOptions extends SchemaBaseOptions, Enumable<string>, Defaultable<Toggle> {
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
	async constructDefault(schema) {
		return ((await getDefault(schema)) ?? false) as SchemaType<typeof schema>
	},
})

defineSchemaComparison("Toggle", "Toggle", {
	equality(lhs, rhs) {
		return lhs == rhs
	},
})
