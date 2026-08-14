import { SchemaBaseOptions, Schema, defineSchemaType, S } from "./schema-base"
import { isTransformTriggerSpec, TriggerAutomation } from "../automation/triggers"
import { nanoid } from "nanoid/non-secure"
import { SchemaType } from "./schema-typing"

export interface SchemaTriggerOptions extends SchemaBaseOptions {}
export interface SchemaTrigger extends Schema, SchemaTriggerOptions {
	type: "Trigger"
}

declare module "../schema/schema-base" {
	namespace S {
		function Trigger(options?: SchemaTriggerOptions): SchemaTrigger
	}

	interface SchemaTypeMap {
		Trigger: SchemaMapping<SchemaTrigger, TriggerAutomation>
	}
}

S.Trigger = (options) => {
	return {
		type: "Trigger",
		...options,
	}
}

defineSchemaType<SchemaTrigger>({
	type: "Trigger",
	name: "Trigger",
	color: "#000000",
	icon: "mdi mdi-switch",
	traits: {},
	async constructDefault(schema) {
		return {
			id: nanoid(),
			plugin: "",
			trigger: "",
			stop: false,
			config: undefined,
		} as SchemaType<typeof schema>
	},
})
