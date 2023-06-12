import { Color } from "castmate-schema"
import { Schema, SchemaType } from "castmate-schema"
import { initingPlugin } from "../plugins/plugin"
import { SemanticVersion } from "../util/type-helpers"

interface ActionMetaData {
	id: string
	name: string
	description?: string
	icon?: string
	color?: Color
	version?: SemanticVersion
}

type ActionInvokeContextData = Record<PropertyKey, any>

interface ActionDefinitionSpec<ConfigSchema extends Schema, ResultSchema extends Schema | undefined>
	extends ActionMetaData {
	config: ConfigSchema
	result?: ResultSchema
	invoke(
		config: Readonly<SchemaType<ConfigSchema>>,
		contextData?: ActionInvokeContextData,
		abortSignal?: AbortSignal
	): Promise<ResultSchema extends Schema ? SchemaType<ResultSchema> : void>
}

export interface ActionDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon?: string
	readonly color?: Color

	invoke(config: any, contextData: ActionInvokeContextData, abortSignal: AbortSignal): Promise<any>
}

class ActionImplementation<ConfigSchema extends Schema, ResultSchema extends Schema | undefined>
	implements ActionDefinition
{
	private spec: ActionDefinitionSpec<ConfigSchema, ResultSchema>
	constructor(spec: ActionDefinitionSpec<ConfigSchema, ResultSchema>) {
		this.spec = spec
	}

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
		return this.spec.icon
	}

	get color() {
		return this.spec.color
	}

	get version() {
		return this.spec.version
	}

	async invoke(
		config: Readonly<SchemaType<ConfigSchema>>,
		contextData: ActionInvokeContextData,
		abortSignal: AbortSignal
	) {
		if (abortSignal.aborted) return

		return await this.spec.invoke(config, contextData, abortSignal)
	}
}

export function defineAction<ConfigSchema extends Schema, ResultSchema extends Schema | undefined>(
	spec: ActionDefinitionSpec<ConfigSchema, ResultSchema>
) {
	if (!initingPlugin) {
		throw new Error("Can only be used while initing a plugin")
	}

	const impl = new ActionImplementation<ConfigSchema, ResultSchema>({
		icon: "mdi-pencil",
		color: initingPlugin.color,
		version: "0.0.0",
		...spec,
	})

	initingPlugin.actions.set(impl.id, impl)

	return impl
}
