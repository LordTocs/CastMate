import { Color } from "../data/color"
import { defineEditorEvent, defineRawEditorEvent, defineRawEditorFunction } from "../editor/editor"
import { S } from "../schema/schema-index"
import { SchemaObject, TSchemaProperties } from "../schema/schema-object"

export interface PluginBaseSpecification {
	id: string
	color: Color
	dependencies: PluginDependency[]
	settings: SchemaObject<TSchemaProperties>
	secrets: SchemaObject<TSchemaProperties>
	state: SchemaObject<TSchemaProperties>
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
	dependencies?: PluginDependency[]
}

//TODO: Maybe make this versioned?
export type PluginDependency = string

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
		dependencies: desc.dependencies ?? [],
	}
}

export const updatePluginStateEvent = defineRawEditorEvent<
	(plugin: string, settingPath: string, settingValue: any) => void
>("plugins", "updateSetting")

export const updatePluginSettingEvent = defineRawEditorEvent<
	(plugin: string, settingPath: string, settingValue: any) => void
>("plugins", "updateSetting")

export const initPluginDataEvent = defineRawEditorEvent<
	(plugin: string, settings: Record<string, any>, secrets: Record<string, any>, state: Record<string, any>) => void
>("plugins", "init")

export interface LoadedPluginInfo {
	[id: string]: {
		settings: Record<string, any>
		secrets: Record<string, any>
		state: Record<string, any>
	}
}

export const getLoadedPluginsFunc = defineRawEditorFunction<() => LoadedPluginInfo>("plugins", "getLoadedPlugins")

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
