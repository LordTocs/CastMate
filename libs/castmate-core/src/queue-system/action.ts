import { Color } from "../data/color"
import { SemanticVersion } from "../util/type-helpers"
import { SchemaObjectBase } from "../data/schema"

interface ActionMetaData {
	name: string
	description?: string
	icon?: string
	color?: Color
	version?: SemanticVersion
}

type ActionInvokeContextData = Record<PropertyKey, any>

interface ActionDefinitionSpec<
	Config extends SchemaObjectBase,
	Result extends SchemaObjectBase | void = void
> extends ActionMetaData {
	invoke(
		config: Config,
		contextData?: ActionInvokeContextData,
		abortSignal?: AbortSignal
	): Promise<Result>
}

class ActionDefinition<
	Config extends SchemaObjectBase,
	Result extends SchemaObjectBase | void = void
> {
	private spec: ActionDefinitionSpec<Config, Result>
	constructor(spec: ActionDefinitionSpec<Config, Result>) {
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
}

export function defineAction<
	Config extends SchemaObjectBase,
	Result extends SchemaObjectBase | void = void
>(spec: ActionDefinitionSpec<Config, Result>) {
	return new ActionDefinition<Config, Result>({
		icon: "mdi-pencil",
		color: "#f0f0f0",
		version: "0.0.0",
		...spec,
	})
}
