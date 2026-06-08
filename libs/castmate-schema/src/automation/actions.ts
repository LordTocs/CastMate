import { PluginBaseSpecification, testPlugin } from "../plugins/plugins"
import { S } from "../schema/schema-base"
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

export function defineAction<ConfigProperties extends TSchemaProperties, ResultProperties extends TSchemaProperties>(
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
	result: {
		c: S.FilePath(),
	},
})
