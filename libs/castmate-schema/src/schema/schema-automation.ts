import { SchemaBaseOptions, Schema, defineSchemaType, S } from "./schema-base"
import { InlineAutomation, createInlineAutomation } from "../automation/automations"
import { SchemaType } from "./schema-typing"

export interface SchemaInlineAutomationOptions extends SchemaBaseOptions {}
export interface SchemaInlineAutomation extends Schema, SchemaInlineAutomationOptions {
	type: "InlineAutomation"
}

declare module "../schema/schema-base" {
	namespace S {
		function InlineAutomation(options?: SchemaInlineAutomationOptions): SchemaInlineAutomation
	}

	interface SchemaTypeMap {
		InlineAutomation: SchemaMapping<SchemaInlineAutomation, InlineAutomation>
	}
}

S.InlineAutomation = (options) => {
	return {
		type: "InlineAutomation",
		...options,
	}
}

defineSchemaType<SchemaInlineAutomation>({
	type: "InlineAutomation",
	name: "Inline Automation",
	color: "#000000",
	icon: "mdi mdi-switch",
	traits: {},
	async constructDefault(schema) {
		return createInlineAutomation() as SchemaType<typeof schema>
	},
})
