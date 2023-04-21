import { Color } from "../data/color"
import { SemanticVersion } from "../util/type-helpers"
import { Schema, SchemaType } from "../data/schema"

interface TriggerMetaData {
	name: string
	description?: string
	icon?: string
	color?: Color
	version?: SemanticVersion
}

interface TriggerDefinitionSpec<
	ConfigSchema extends Schema,
	ContextDataSchema extends Schema
> extends TriggerMetaData {
	config: ConfigSchema
	context: ContextDataSchema
	handle(
		config: SchemaType<ConfigSchema>,
		context: SchemaType<ContextDataSchema>
	): Promise<boolean>
}

class TriggerDefinition<
	ConfigSchema extends Schema,
	ContextDataSchema extends Schema
> {
	constructor(
		private spec: TriggerDefinitionSpec<ConfigSchema, ContextDataSchema>
	) {}

	get name() {
		return this.spec.name
	}

	get description() {
		return this.spec.description
	}

	get icon() {
		return this.spec.icon
	}

	get color() {
		return this.spec.color
	}

	get version() {
		return this.spec.version
	}

	async handle(
		config: SchemaType<ConfigSchema>,
		context: SchemaType<ContextDataSchema>
	): Promise<boolean> {
		return await this.spec.handle(config, context)
	}
}

export function defineTrigger<
	Config extends Schema,
	ContextData extends Schema
>(spec: TriggerDefinitionSpec<Config, ContextData>) {
	return new TriggerDefinition<Config, ContextData>({
		icon: "mdi-pencil",
		color: "#f0f0f0",
		version: "0.0.0",
		...spec,
	})
}
