import { Color } from "../data/color"
import { SemanticVersion } from "../util/type-helpers"
import { SchemaObjectBase } from "../data/schema"

interface TriggerMetaData {
	name: string
	description?: string
	icon?: string
	color?: Color
	version?: SemanticVersion
}

interface TriggerDefinitionSpec<
	Config extends SchemaObjectBase,
	ContextData extends SchemaObjectBase
> extends TriggerMetaData {
	handle(config: Config, context: ContextData): Promise<boolean>
}

class TriggerDefinition<
	Config extends SchemaObjectBase,
	ContextData extends SchemaObjectBase
> {
	private spec: TriggerDefinitionSpec<Config, ContextData>
	constructor(spec: TriggerDefinitionSpec<Config, ContextData>) {
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

export function defineTrigger<
	Config extends SchemaObjectBase,
	ContextData extends SchemaObjectBase
>(spec: TriggerDefinitionSpec<Config, ContextData>) {
	return new TriggerDefinition<Config, ContextData>({
		icon: "mdi-pencil",
		color: "#f0f0f0",
		version: "0.0.0",
		...spec,
	})
}
