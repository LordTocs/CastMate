import { PluginBaseSpecification, testPlugin } from "../plugins/plugins"
import { S } from "../schema/schema-index"
import { SchemaObject, TSchemaProperties } from "../schema/schema-object"

export interface ActionSpecification<
	ConfigProperties extends TSchemaProperties,
	ResultProperties extends TSchemaProperties | undefined
> {
	id: string
	config: SchemaObject<ConfigProperties>
	result?: ResultProperties extends TSchemaProperties ? SchemaObject<ResultProperties> : void
	plugin: string
}

export interface ActionDesc<
	ConfigProperties extends TSchemaProperties,
	ResultProperties extends TSchemaProperties | undefined
> {
	id: string
	config: ConfigProperties
	result?: ResultProperties
}

export function defineAction<
	ConfigProperties extends TSchemaProperties,
	ResultProperties extends TSchemaProperties | undefined = undefined
>(
	plugin: PluginBaseSpecification,
	spec: ActionDesc<ConfigProperties, ResultProperties>
): ActionSpecification<ConfigProperties, ResultProperties> {
	return {
		plugin: plugin.id,
		id: spec.id,
		//@ts-expect-error Typescript compiler is wrong here
		result: spec.result != null ? S.Object(spec.result) : undefined,
		config: S.Object(spec.config),
	}
}

export const testActionDesc = defineAction(testPlugin, {
	id: "test",
	config: {
		a: S.Number(),
		b: S.String(),
	},
})

export interface FlowActionSpecification<
	ConfigProperties extends TSchemaProperties,
	FlowConfigProperties extends TSchemaProperties
> {
	id: string
	config: SchemaObject<ConfigProperties>
	flowConfig: SchemaObject<FlowConfigProperties>
	plugin: string
}

export interface FlowActionDesc<
	ConfigProperties extends TSchemaProperties,
	FlowConfigProperties extends TSchemaProperties
> {
	id: string
	config: ConfigProperties
	flowConfig: FlowConfigProperties
}

export function defineFlowAction<
	ConfigProperties extends TSchemaProperties,
	FlowConfigProperties extends TSchemaProperties
>(
	plugin: PluginBaseSpecification,
	spec: FlowActionDesc<ConfigProperties, FlowConfigProperties>
): FlowActionSpecification<ConfigProperties, FlowConfigProperties> {
	return {
		plugin: plugin.id,
		id: spec.id,
		config: S.Object(spec.config),
		flowConfig: S.Object(spec.flowConfig),
	}
}
