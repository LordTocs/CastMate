import { nanoid } from "nanoid/non-secure"
import { Color } from "../data/color"
import { PluginBaseSpecification, testPlugin } from "../plugins/plugins"
import { defineSchemaType, S, Schema, SchemaBaseOptions } from "../schema/schema-base"
import { SchemaObject, TSchemaProperties } from "../schema/schema-object"
import { SchemaType } from "../schema/schema-typing"
import { AutomationData, InlineAutomation } from "./automations"

interface BaseTriggerDesc<ConfigProperties extends TSchemaProperties> {
	id: string
	color: Color
	config: ConfigProperties
	queueable?: boolean
}

interface StandardTriggerDesc<ConfigProperties extends TSchemaProperties, ContextProperties extends TSchemaProperties>
	extends BaseTriggerDesc<ConfigProperties> {
	context: ContextProperties
}

interface TransformTriggerDesc<
	ConfigProperties extends TSchemaProperties,
	ContextProperties extends TSchemaProperties,
	InvokeContextProperties extends TSchemaProperties
> extends BaseTriggerDesc<ConfigProperties> {
	invokeContext: InvokeContextProperties
	context: (
		config: SchemaType<SchemaObject<ConfigProperties>>,
		invokeContext: SchemaType<SchemaObject<InvokeContextProperties>>
	) => ContextProperties
}

type TriggerDesc<
	ConfigProperties extends TSchemaProperties,
	ContextProperties extends TSchemaProperties,
	InvokeContextProperties extends TSchemaProperties
> =
	| StandardTriggerDesc<ConfigProperties, ContextProperties>
	| TransformTriggerDesc<ConfigProperties, ContextProperties, InvokeContextProperties>

interface BaseTriggerSpecification<ConfigProperties extends TSchemaProperties> {
	plugin: string
	id: string
	color: Color
	config: SchemaObject<ConfigProperties>
	queuable: boolean
}

interface StandardTriggerSpecification<
	ConfigProperties extends TSchemaProperties,
	ContextProperties extends TSchemaProperties
> extends BaseTriggerSpecification<ConfigProperties> {
	context: SchemaObject<ContextProperties>
}

interface TransformTriggerSpecification<
	ConfigProperties extends TSchemaProperties,
	ContextProperties extends TSchemaProperties,
	InvokeContextProperties extends TSchemaProperties
> extends BaseTriggerSpecification<ConfigProperties> {
	invokeContext: SchemaObject<InvokeContextProperties>
	context: (
		config: SchemaType<SchemaObject<ConfigProperties>>,
		invokeContext: SchemaType<SchemaObject<InvokeContextProperties>>
	) => ContextProperties
}

export type TriggerSpecification<
	ConfigProperties extends TSchemaProperties,
	ContextProperties extends TSchemaProperties,
	InvokeContextProperties extends TSchemaProperties
> =
	| StandardTriggerSpecification<ConfigProperties, ContextProperties>
	| TransformTriggerSpecification<ConfigProperties, ContextProperties, InvokeContextProperties>

export function isTransformTriggerSpec<
	ConfigProperties extends TSchemaProperties,
	ContextProperties extends TSchemaProperties,
	InvokeContextProperties extends TSchemaProperties
>(
	spec: TriggerSpecification<ConfigProperties, ContextProperties, InvokeContextProperties>
): spec is TransformTriggerSpecification<ConfigProperties, ContextProperties, InvokeContextProperties> {
	if ("invokeContext" in spec) {
		return true
	}
	return false
}

export function defineTrigger<ConfigProperties extends TSchemaProperties, ContextProperties extends TSchemaProperties>(
	plugin: PluginBaseSpecification,
	desc: StandardTriggerDesc<ConfigProperties, ContextProperties>
): StandardTriggerSpecification<ConfigProperties, ContextProperties> {
	return {
		plugin: plugin.id,
		id: desc.id,
		color: desc.color,
		config: S.Object(desc.config),
		context: S.Object(desc.context),
		queuable: desc.queueable ?? true,
	} as StandardTriggerSpecification<ConfigProperties, ContextProperties>
}

export function defineTransformTrigger<
	ConfigProperties extends TSchemaProperties,
	ContextProperties extends TSchemaProperties,
	InvokeContextProperties extends TSchemaProperties
>(
	plugin: PluginBaseSpecification,
	desc: TransformTriggerDesc<ConfigProperties, ContextProperties, InvokeContextProperties>
) {
	return {
		plugin: plugin.id,
		id: desc.id,
		color: desc.color,
		config: S.Object(desc.config),
		invokeContext: S.Object(desc.invokeContext),
		context: desc.context,
		queuable: desc.queueable ?? true,
	} as TransformTriggerSpecification<ConfigProperties, ContextProperties, InvokeContextProperties>
}

export const testTriggerSpec = defineTrigger(testPlugin, {
	id: "test",
	color: "#000000",
	config: {
		a: S.Array(S.Color()),
	},
	context: {
		b: S.Duration(),
	},
})

const t = S.Object({
	a: S.Number(),
})

export const testTriggerSpec2 = defineTransformTrigger(testPlugin, {
	id: "test",
	color: "#000000",
	config: {
		a: S.Array(S.Color()),
	},
	invokeContext: {
		c: S.Number(),
	},
	context(config, invokeContext) {
		return t.properties
	},
})

///

interface TriggerAutomation<ConfigType = any> extends InlineAutomation {
	id: string
	plugin: string
	trigger: string
	stop: boolean
	config: ConfigType
}

export function isTriggerAutomation(obj: AutomationData): obj is TriggerAutomation {
	if ("plugin" in obj) return true
	if ("trigger" in obj) return true
	return false
}

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
