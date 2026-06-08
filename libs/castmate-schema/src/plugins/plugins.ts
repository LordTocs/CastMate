import { Color } from "../data/color"
import { S } from "../schema/schema-base"
import { SchemaObject, TSchemaProperties } from "../schema/schema-object"

export interface PluginBaseSpecification {
	id: string
	color: Color
}

export interface PluginSpecification<
	TSettings extends TSchemaProperties,
	TSecrets extends TSchemaProperties,
	TState extends TSchemaProperties
> extends PluginBaseSpecification {
	settings: SchemaObject<TSettings>
	secrets: SchemaObject<TSecrets>
	state: SchemaObject<TState>
}

export interface PluginDesc<
	TSettings extends TSchemaProperties,
	TSecrets extends TSchemaProperties,
	TState extends TSchemaProperties
> {
	id: string
	color: Color
	settings: TSettings
	secrets: TSecrets
	state: TState
}

export function definePlugin<
	TSettings extends TSchemaProperties,
	TSecrets extends TSchemaProperties,
	TState extends TSchemaProperties
>(desc: PluginDesc<TSettings, TSecrets, TState>): PluginSpecification<TSettings, TSecrets, TState> {
	return {
		id: desc.id,
		color: desc.color,
		settings: S.Object(desc.settings),
		secrets: S.Object(desc.secrets),
		state: S.Object(desc.state),
	}
}

export const testPlugin = definePlugin({
	id: "test",
	color: "#000000",
	settings: {
		testSetting: S.String(),
	},
	secrets: {},
	state: {
		a: S.Number(),
		b: S.Color(),
		c: S.Array(S.String()),
	},
})
