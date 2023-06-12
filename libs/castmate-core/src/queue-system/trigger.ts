import { Color } from "castmate-schema"
import { SemanticVersion } from "../util/type-helpers"
import { Schema, SchemaType } from "castmate-schema"
import { initingPlugin } from "../plugins/plugin"

interface TriggerMetaData {
	id: string
	name: string
	description?: string
	icon?: string
	color?: Color
	version?: SemanticVersion
}

interface TriggerDefinitionSpec<ConfigSchema extends Schema, ContextDataSchema extends Schema> extends TriggerMetaData {
	config: ConfigSchema
	context: ContextDataSchema
	handle(config: SchemaType<ConfigSchema>, context: SchemaType<ContextDataSchema>): Promise<boolean>
}

export interface TriggerDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon: string
	readonly color: Color
	readonly version: string

	handle(config: any, context: any): Promise<boolean>
}

class TriggerImplementation<ConfigSchema extends Schema, ContextDataSchema extends Schema> {
	constructor(private spec: TriggerDefinitionSpec<ConfigSchema, ContextDataSchema>) {}

	get id() {
		return this.spec.id
	}

	get name() {
		return this.spec.name
	}

	get description() {
		return this.spec.description
	}

	get icon() {
		return this.spec.icon ?? "mdi-puzzle"
	}

	get color() {
		return this.spec.color ?? "#efefef"
	}

	get version() {
		return this.spec.version ?? "0.0.0"
	}

	async handle(config: SchemaType<ConfigSchema>, context: SchemaType<ContextDataSchema>): Promise<boolean> {
		return await this.spec.handle(config, context)
	}
}

export function defineTrigger<Config extends Schema, ContextData extends Schema>(
	spec: TriggerDefinitionSpec<Config, ContextData>
) {
	if (!initingPlugin) {
		throw new Error("Can only be used in definePlugin")
	}

	const impl = new TriggerImplementation<Config, ContextData>({
		icon: "mdi-pencil",
		color: "#f0f0f0",
		version: "0.0.0",
		...spec,
	})

	const pluginId = initingPlugin.id

	initingPlugin.triggers.set(impl.id, impl)

	return (context: SchemaType<ContextData>) => {}
}
