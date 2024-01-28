import { defineStore } from "pinia"

import {
	IPCActionDefinition,
	IPCPluginDefinition,
	IPCTriggerDefinition,
	Schema,
	Color,
	mapKeys,
	constructDefault,
	InstantAction,
	TimeAction,
	FlowAction,
	AnyAction,
	ActionInfo,
	IPCDurationConfig,
	IPCSettingsDefinition,
	IPCStateDefinition,
} from "castmate-schema"

import { computed, ref, unref, type MaybeRefOrGetter, toValue, Component, markRaw } from "vue"

import * as chromatism from "chromatism2"
import { handleIpcMessage, useIpcCaller } from "../util/electron"
import { ipcParseDynamicSchema, ipcParseSchema } from "../util/data"
import { nanoid } from "nanoid/non-secure"

interface BaseActionDefinition {
	id: string
	name: string
	description?: string
	icon?: string
	color?: Color
}

interface RegularActionDefinition extends BaseActionDefinition {
	type: "regular"
	actionComponent?: Component
	duration: IPCDurationConfig
	config: Schema
	result?: Schema
}

interface FlowActionDefinition extends BaseActionDefinition {
	type: "flow"
	config: Schema
	flowConfig?: Schema
}

export type ActionDefinition = RegularActionDefinition | FlowActionDefinition

function ipcParseActionDefinition(def: IPCActionDefinition): ActionDefinition {
	if (def.type == "flow") {
		return {
			type: "flow",
			id: def.id,
			name: def.name,
			description: def.description,
			color: def.color,
			icon: def.icon,
			config: ipcParseSchema(def.config),
			...(def.flowConfig ? { flowConfig: ipcParseSchema(def.flowConfig) } : {}),
		}
	} else if (def.type == "regular") {
		return {
			type: "regular",
			id: def.id,
			name: def.name,
			description: def.description,
			color: def.color,
			icon: def.icon,
			config: ipcParseSchema(def.config),
			duration: def.duration,
			...(def.result ? { result: ipcParseSchema(def.result) } : {}),
		}
	}
	throw new Error("Parse Error?")
}

interface TriggerDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon?: string
	readonly color: Color
	readonly version: string
	config: Schema
	context: Schema | ((config: any) => Promise<Schema>)
}

function ipcParseTriggerDefinition(def: IPCTriggerDefinition): TriggerDefinition {
	const triggerDef: TriggerDefinition = {
		id: def.id,
		name: def.name,
		description: def.description,
		icon: def.icon,
		color: def.color,
		version: def.version,
		config: ipcParseSchema(def.config),
		context: ipcParseDynamicSchema(def.context),
	}

	return triggerDef
}

export interface SettingValue {
	type: "value"
	schema: Schema
	value: any
}

export interface SettingSecret {
	type: "secret"
	schema: Schema
	value: any
}

export interface ResourceSetting {
	type: "resource"
	resourceId: string
	name: string
	description?: string
}

export interface ComponentSetting {
	type: "component"
	component?: Component
}

export type SettingDefinition = SettingValue | ResourceSetting | SettingSecret | ComponentSetting

function ipcParseSettingsDefinition(def: IPCSettingsDefinition): SettingDefinition {
	if (def.type == "resource") {
		return def
	} else if (def.type == "value") {
		return {
			type: "value",
			schema: ipcParseSchema(def.schema),
			value: def.value,
		}
	} else if (def.type == "secret") {
		return {
			type: "secret",
			schema: ipcParseSchema(def.schema),
			value: def.value,
		}
	} else if (def.type == "component") {
		return {
			type: "component",
		}
	}
	throw new Error()
}

export interface StateDefinition {
	schema: Schema
	value: any
}

function ipcParseStateDefinition(def: IPCStateDefinition): StateDefinition {
	return {
		schema: ipcParseSchema(def.schema),
		value: def.value,
	}
}

interface PluginDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon: string
	readonly color: Color
	readonly version: string

	actions: Record<string, ActionDefinition>
	triggers: Record<string, TriggerDefinition>
	settings: Record<string, SettingDefinition>
	state: Record<string, StateDefinition>
}

function ipcParsePluginDefinition(def: IPCPluginDefinition): PluginDefinition {
	const pluginDef = {
		id: def.id,
		name: def.name,
		description: def.description,
		icon: def.icon,
		color: def.color,
		version: def.version,
		actions: mapKeys(def.actions, (key, value) => ipcParseActionDefinition(value)),
		triggers: mapKeys(def.triggers, (key, value) => ipcParseTriggerDefinition(value)),
		settings: mapKeys(def.settings, (key, value) => ipcParseSettingsDefinition(value)),
		state: mapKeys(def.state, (key, value) => ipcParseStateDefinition(value)),
	}

	return pluginDef
}

export interface SettingsChange {
	pluginId: string
	settingId: string
	value: any
}

export const usePluginStore = defineStore("plugins", () => {
	const pluginMap = ref<Map<string, PluginDefinition>>(new Map())

	const getPluginIds = useIpcCaller<() => string[]>("plugins", "getPluginIds")
	const getPlugin = useIpcCaller<(id: string) => IPCPluginDefinition>("plugins", "getPlugin")
	const doSettingsUpdate = useIpcCaller<(changes: SettingsChange[]) => boolean>("plugins", "updateSettings")

	async function initialize() {
		handleIpcMessage("plugins", "registerPlugin", (event, plugin: IPCPluginDefinition) => {
			//console.log("Registering Late Plugin", plugin.id)
			//pluginMap.value.set(plugin.id, ipcParsePluginDefinition(plugin))
		})

		handleIpcMessage("plugins", "unregisterPlugin", (event, id: string) => {
			//pluginMap.value.delete(id)
		})

		handleIpcMessage("plugins", "updateSettings", (event, id: string, settingId: string, value: any) => {
			const plugin = pluginMap.value.get(id)
			if (plugin) {
				const setting = plugin.settings[settingId]
				if (setting?.type == "value") {
					setting.value = value
				}
			}
		})

		handleIpcMessage("plugins", "updateState", (event, id: string, stateId: string, value: any) => {
			const plugin = pluginMap.value.get(id)
			if (plugin) {
				const state = plugin.state[stateId]
				if (state) {
					state.value = value
				}
			}
		})

		handleIpcMessage(
			"plugins",
			"setStateDef",
			(event, pluginId: string, stateId: string, stateDef: IPCStateDefinition) => {
				const plugin = pluginMap.value.get(pluginId)
				if (plugin) {
					plugin.state[stateId] = ipcParseStateDefinition(stateDef)
				}
			}
		)

		handleIpcMessage("plugins", "deleteStateDef", (event, pluginId: string, stateId: string) => {
			const plugin = pluginMap.value.get(pluginId)
			if (plugin) {
				delete plugin.state[stateId]
			}
		})

		const ids = await getPluginIds()
		console.log("Received Plugin Ids", ids)

		const plugins = await Promise.all(ids.map((id) => getPlugin(id)))

		for (let i = 0; i < ids.length; ++i) {
			pluginMap.value.set(ids[i], ipcParsePluginDefinition(plugins[i]))
		}

		console.log("Loaded All Plugins", JSON.stringify(ids))
	}

	function getAction(selection: ActionSelection): ActionDefinition | undefined {
		if (!selection.plugin || !selection.action) return undefined
		return pluginMap.value.get(selection.plugin)?.actions?.[selection.action]
	}

	async function createAction(selection: ActionSelection): Promise<AnyAction | undefined> {
		if (!selection.plugin || !selection.action) return undefined
		const action = getAction(selection)
		if (!action) return undefined

		const result: Record<string, any> = {
			id: nanoid(),
			plugin: selection.plugin,
			action: selection.action,
			config: await constructDefault(action.config),
		}

		if (action.type == "flow") {
			result.subFlows = [
				{
					id: nanoid(),
					config: action.flowConfig ? await constructDefault(action.flowConfig) : {},
					actions: [],
				},
				{
					id: nanoid(),
					config: action.flowConfig ? await constructDefault(action.flowConfig) : {},
					actions: [],
				},
			]
		}

		// if (action.type == "time" || action.type == "time-indefinite") {
		// 	result.offsets = []
		// }

		return result as AnyAction
	}

	function setActionComponent(plugin: string, action: string, component: Component) {
		const pluginDef = pluginMap.value.get(plugin)
		if (!pluginDef) {
			console.error(`Unknown plugin ${plugin}`)
			return
		}
		const actionDef = pluginDef.actions[action]
		if (!actionDef) {
			console.error(`Unknown action ${plugin}:${action}`)
			return
		}
		if (actionDef.type != "regular") return
		actionDef.actionComponent = markRaw(component)
		console.log("Set Action Component", plugin, action, component)
	}

	function setSettingComponent(plugin: string, key: string, component: Component) {
		const pluginDef = pluginMap.value.get(plugin)
		if (!pluginDef) {
			console.error(`Unknown plugin ${plugin}`)
			return
		}

		const settingDef = pluginDef.settings[key]
		if (settingDef?.type != "component") {
			console.error(`${key} is not a component setting`)
			return
		}

		settingDef.component = component
	}

	///

	async function updateSettings(changes: SettingsChange[]) {
		await doSettingsUpdate(changes)
	}

	return {
		pluginMap: computed(() => pluginMap.value),
		initialize,
		createAction,
		getAction,
		setActionComponent,
		setSettingComponent,
		updateSettings,
	}
})

export function usePlugin(id: MaybeRefOrGetter<string | undefined>) {
	const pluginStore = usePluginStore()

	return computed(() => {
		const pluginId = toValue(id)
		if (!pluginId) return undefined
		return pluginStore.pluginMap.get(pluginId)
	})
}

export interface TriggerSelection {
	plugin?: string
	trigger?: string
}

export function useTrigger(selection: MaybeRefOrGetter<TriggerSelection | undefined>) {
	const pluginStore = usePluginStore()
	return computed(() => {
		const selectionValue = toValue(selection)

		if (!selectionValue) {
			return undefined
		}

		if (!selectionValue.plugin || !selectionValue.trigger) return undefined

		return pluginStore.pluginMap.get(selectionValue.plugin)?.triggers?.[selectionValue.trigger]
	})
}

export function useTriggerColors(selection: MaybeRefOrGetter<TriggerSelection | undefined>) {
	const trigger = useTrigger(selection)

	const {
		color: triggerColor,
		darkerColor: darkerTriggerColor,
		darkestColor: darkestTriggerColor,
		lighterColor: lighterTriggerColor,
	} = useColors(trigger)
	//console.log("Using Trigger Colors", toValue(selection), triggerColor.value)

	const style = computed(() => {
		return {
			"--trigger-color": triggerColor.value,
			"--darker-trigger-color": darkerTriggerColor.value,
			"--darkest-trigger-color": darkestTriggerColor.value,
			"--lighter-trigger-color": lighterTriggerColor.value,
		}
	})

	return { darkestTriggerColor, darkerTriggerColor, triggerColor, lighterTriggerColor, triggerColorStyle: style }
}

export interface ActionSelection {
	plugin?: string
	action?: string
}

export function useAction(selection: MaybeRefOrGetter<ActionSelection | undefined>) {
	const pluginStore = usePluginStore()

	return computed(() => {
		const selectionValue = toValue(selection)

		if (!selectionValue) {
			return undefined
		}

		if (!selectionValue.plugin || !selectionValue.action) return undefined
		return pluginStore.pluginMap.get(selectionValue.plugin)?.actions?.[selectionValue.action]
	})
}

export function useColors(colorProvider: MaybeRefOrGetter<{ color?: string } | undefined>) {
	const defaultColor = "#3e3e3e"

	const color = computed(() => toValue(colorProvider)?.color ?? defaultColor)
	const darkerColor = computed(() => chromatism.shade(-20, color.value).hex)
	const darkestColor = computed(() => chromatism.shade(-30, color.value).hex)
	const lighterColor = computed(() => chromatism.brightness(20, color.value).hex)

	return { color, darkerColor, darkestColor, lighterColor }
}

export function useActionColors(selection: MaybeRefOrGetter<ActionSelection | undefined>) {
	const action = useAction(selection)

	const {
		color: actionColor,
		darkerColor: darkerActionColor,
		darkestColor: darkestActionColor,
		lighterColor: lighterActionColor,
	} = useColors(action)

	const style = computed(() => ({
		"--action-color": actionColor.value,
		"--darker-action-color": darkerActionColor.value,
		"--darkest-action-color": darkestActionColor.value,
		"--lighter-action-color": lighterActionColor.value,
	}))

	return {
		darkestActionColor,
		darkerActionColor,
		actionColor,
		lighterActionColor,
		actionColorStyle: style,
	}
}

export function useState<T = any>(stateSel: MaybeRefOrGetter<{ plugin?: string; state?: string } | null | undefined>) {
	const pluginStore = usePluginStore()

	return computed(() => {
		const sel = toValue(stateSel)
		if (!sel || !sel.plugin || !sel.state) return undefined

		const plugin = pluginStore.pluginMap.get(sel.plugin)
		if (!plugin) return undefined

		const state = plugin.state[sel.state]

		if (!state) return undefined

		return state
	})
}
