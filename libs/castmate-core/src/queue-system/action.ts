import { Color } from "../data/color"
import { Schema, SchemaType } from "../data/schema"
import { SemanticVersion } from "../util/type-helpers"

interface ActionMetaData {
	name: string
	description?: string
	icon?: string
	color?: Color
	version?: SemanticVersion
}

type ActionInvokeContextData = Record<PropertyKey, any>

interface ActionDefinitionSpec<
	ConfigSchema extends Schema,
	ResultSchema extends Schema | undefined
> extends ActionMetaData {
	config: ConfigSchema
	result?: ResultSchema
	invoke(
		config: Readonly<SchemaType<ConfigSchema>>,
		contextData?: ActionInvokeContextData,
		abortSignal?: AbortSignal
	): Promise<ResultSchema extends Schema ? SchemaType<ResultSchema> : void>
}

class ActionDefinition<
	ConfigSchema extends Schema,
	ResultSchema extends Schema | undefined
> {
	private spec: ActionDefinitionSpec<ConfigSchema, ResultSchema>
	constructor(spec: ActionDefinitionSpec<ConfigSchema, ResultSchema>) {
		this.spec = spec
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

export function defineAction<
	ConfigSchema extends Schema,
	ResultSchema extends Schema | undefined
>(spec: ActionDefinitionSpec<ConfigSchema, ResultSchema>) {
	return new ActionDefinition<ConfigSchema, ResultSchema>({
		icon: "mdi-pencil",
		color: "#f0f0f0",
		version: "0.0.0",
		...spec,
	})
}
