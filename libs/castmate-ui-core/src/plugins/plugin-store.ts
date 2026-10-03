import { defineStore } from "pinia"

import {
	Schema,
	Color,
	mapKeys,
	InstantAction,
	TimeAction,
	FlowAction,
	AnyAction,
	ActionInfo,
	TSchemaProperties,
	SchemaObject,
	SchemaType,
	PluginSpecification,
	PluginBaseSpecification,
	updatePluginStateEvent,
	updatePluginSettingEvent,
	getSchemaMetaData,
	initPluginDataEvent,
} from "castmate-schema"

import { computed, ref, unref, type MaybeRefOrGetter, toValue, Component, markRaw, onMounted, onUnmounted } from "vue"

import * as chromatism from "chromatism2"
import { nanoid } from "nanoid/non-secure"
import { handleEditorEvent, handleRawEditorEvent } from "../editor/editor-ui-util"

export interface SettingsChange {
	pluginId: string
	settingId: string
	value: any
}

interface RendererPluginBase {
	spec: PluginBaseSpecification
	settings: Record<string, any>
	secrets: Record<string, any>
	state: Record<string, any>
	loaded: boolean
}

interface RendererPlugin<
	TSettings extends TSchemaProperties,
	TSecrets extends TSchemaProperties,
	TState extends TSchemaProperties
> extends RendererPluginBase {
	spec: PluginSpecification<TSettings, TSecrets, TState>
	settings: SchemaType<SchemaObject<TSettings>>
	secrets: SchemaType<SchemaObject<TSecrets>>
	state: SchemaType<SchemaObject<TState>>
}

export type SettingUpdateWatcher = (plugin: string, setting: string, value: any) => any

export const usePluginStore = defineStore("plugins", () => {
	const pluginMap = ref<Map<string, RendererPluginBase>>(new Map())

	const settingsUpdateWatchers = new Array<SettingUpdateWatcher>()

	async function initialize() {
		// handleIpcMessage("plugins", "updateSettings", (event, id: string, settingId: string, value: any) => {
		// 	const plugin = pluginMap.value.get(id)
		// 	if (plugin) {
		// 		const setting = plugin.settings[settingId]
		// 		if (setting?.type == "value" || setting?.type == "secret") {
		// 			setting.value = value
		// 			for (const watcher of settingsUpdateWatchers) {
		// 				watcher(id, settingId, value)
		// 			}
		// 		}
		// 	}
		// })
		handleRawEditorEvent(initPluginDataEvent, async (pluginId, settings, secrets, state) => {
			const plugin = pluginMap.value.get(pluginId)

			if (!plugin) return

			for (const settingKey of Object.keys(plugin.spec.settings.properties)) {
				const settingType = getSchemaMetaData(plugin.spec.settings.properties[settingKey].type)
				//DESERIALIZE
				plugin.settings[settingKey] = settings[settingKey]
			}

			plugin.loaded = true
		})

		handleRawEditorEvent(updatePluginStateEvent, async (pluginId, stateId, value) => {
			const plugin = pluginMap.value.get(pluginId)
			if (plugin) {
				const state = plugin.state[stateId]
				const stateType = getSchemaMetaData(plugin.spec.state.properties[stateId].type)

				//TODO: Deserialize

				if (state) {
					state.value = value
				}
			}
		})

		handleRawEditorEvent(updatePluginSettingEvent, async (pluginId, settingId, value) => {
			const plugin = pluginMap.value.get(pluginId)
			if (plugin) {
				const state = plugin.settings[settingId]
				if (state) {
					state.value = value
				}
			}
		})

		// handleIpcMessage(
		// 	"plugins",
		// 	"setStateDef",
		// 	(event, pluginId: string, stateId: string, stateDef: IPCStateDefinition) => {
		// 		const plugin = pluginMap.value.get(pluginId)
		// 		if (plugin) {
		// 			plugin.state[stateId] = ipcParseStateDefinition(stateDef)
		// 		}
		// 	}
		// )

		// handleIpcMessage("plugins", "deleteStateDef", (event, pluginId: string, stateId: string) => {
		// 	const plugin = pluginMap.value.get(pluginId)
		// 	if (plugin) {
		// 		delete plugin.state[stateId]
		// 	}
		// })
	}

	function registerPlugin<
		TSettings extends TSchemaProperties,
		TSecrets extends TSchemaProperties,
		TState extends TSchemaProperties
	>(spec: PluginSpecification<TSettings, TSecrets, TState>) {
		const plugin: RendererPlugin<TSettings, TSecrets, TState> = {
			spec,
			//@ts-ignore - filled in by load
			settings: {},
			//@ts-ignore - filled in by load
			secrets: {},
			//@ts-ignore - filled in by load
			state: {},
			loaded: false,
		}

		pluginMap.value.set(spec.id, plugin)
	}

	function getRendererPlugin<
		TSettings extends TSchemaProperties,
		TSecrets extends TSchemaProperties,
		TState extends TSchemaProperties
	>(spec: PluginSpecification<TSettings, TSecrets, TState>) {
		const plugin = pluginMap.value.get(spec.id)

		if (!plugin) {
			throw new Error("Unknown plugin")
		}

		return plugin as RendererPlugin<TSettings, TSecrets, TState>
	}

	// function getAction(selection: ActionSelection): ActionDefinition | undefined {
	// 	if (!selection.plugin || !selection.action) return undefined
	// 	return pluginMap.value.get(selection.plugin)?.actions?.[selection.action]
	// }

	// async function createAction(selection: ActionSelection): Promise<AnyAction | undefined> {
	// 	if (!selection.plugin || !selection.action) return undefined
	// 	const action = getAction(selection)
	// 	if (!action) return undefined

	// 	const result: Record<string, any> = {
	// 		id: nanoid(),
	// 		plugin: selection.plugin,
	// 		action: selection.action,
	// 		config: await constructDefault(action.config),
	// 	}

	// 	if (action.type == "flow") {
	// 		result.subFlows = [
	// 			{
	// 				id: nanoid(),
	// 				config: action.flowConfig ? await constructDefault(action.flowConfig) : {},
	// 				actions: [],
	// 			},
	// 			{
	// 				id: nanoid(),
	// 				config: action.flowConfig ? await constructDefault(action.flowConfig) : {},
	// 				actions: [],
	// 			},
	// 		]
	// 	}

	// 	if (action.type == "regular" && action.result) {
	// 		result.resultMapping = {} as Record<string, string>

	// 		for (const prop of Object.keys(action.result.properties)) {
	// 			result.resultMapping[prop] = prop
	// 		}
	// 	}

	// 	// if (action.type == "time" || action.type == "time-indefinite") {
	// 	// 	result.offsets = []
	// 	// }

	// 	return result as AnyAction
	// }

	// function setActionComponent<Props, C extends Component<Props>>(
	// 	plugin: string,
	// 	action: string,
	// 	component: C,
	// 	extraProps?: Partial<Props>
	// ) {
	// 	const pluginDef = pluginMap.value.get(plugin)
	// 	if (!pluginDef) {
	// 		console.error(`Unknown plugin ${plugin}`)
	// 		return
	// 	}
	// 	const actionDef = pluginDef.actions[action]
	// 	if (!actionDef) {
	// 		console.error(`Unknown action ${plugin}:${action}`)
	// 		return
	// 	}
	// 	if (actionDef.type != "regular") return
	// 	actionDef.actionComponent = markRaw(component)
	// 	actionDef.componentExtraProps = extraProps
	// 	console.log("Set Action Component", plugin, action, component)
	// }

	// function setFlowActionComponent<Props, C extends Component<Props>>(
	// 	plugin: string,
	// 	action: string,
	// 	component: C,
	// 	extraProps?: Partial<Props>
	// ) {
	// 	const pluginDef = pluginMap.value.get(plugin)
	// 	if (!pluginDef) {
	// 		console.error(`Unknown plugin ${plugin}`)
	// 		return
	// 	}
	// 	const actionDef = pluginDef.actions[action]
	// 	if (!actionDef) {
	// 		console.error(`Unknown action ${plugin}:${action}`)
	// 		return
	// 	}
	// 	if (actionDef.type != "flow") return
	// 	actionDef.flowComponent = markRaw(component)
	// 	actionDef.flowComponentExtraProps = extraProps
	// 	console.log("Set Flow Action Component", plugin, action, component)
	// }

	// function setTriggerHeaderComponent(plugin: string, trigger: string, component: Component) {
	// 	const pluginDef = pluginMap.value.get(plugin)
	// 	if (!pluginDef) {
	// 		console.error(`Unknown plugin ${plugin}`)
	// 		return
	// 	}
	// 	const triggerDef = pluginDef.triggers[trigger]
	// 	if (!triggerDef) {
	// 		console.error(`Unknown trigger ${plugin}:${trigger}`)
	// 		return
	// 	}
	// 	triggerDef.headerComponent = markRaw(component)
	// }

	// function setSettingComponent(plugin: string, key: string, component: Component) {
	// 	const pluginDef = pluginMap.value.get(plugin)
	// 	if (!pluginDef) {
	// 		console.error(`Unknown plugin ${plugin}`)
	// 		return
	// 	}

	// 	const settingDef = pluginDef.settings[key]
	// 	if (settingDef?.type != "component") {
	// 		console.error(`${key} is not a component setting`)
	// 		return
	// 	}

	// 	console.log("Setting Component", plugin, key, component)
	// 	settingDef.component = markRaw(component)
	// }

	// ///

	// async function updateSettings(changes: SettingsChange[]) {
	// 	await doSettingsUpdate(changes)
	// }

	function registerSettingWatcher(watcher: SettingUpdateWatcher) {
		settingsUpdateWatchers.push(watcher)
	}

	function unregisterSettingWatcher(watcher: SettingUpdateWatcher) {
		const idx = settingsUpdateWatchers.findIndex((w) => w == watcher)
		if (idx < 0) return
		settingsUpdateWatchers.splice(idx, 1)
	}

	return {
		pluginMap: computed(() => pluginMap.value),
		initialize,
		// createAction,
		// getAction,
		// setActionComponent,
		// setFlowActionComponent,
		// setSettingComponent,
		// setTriggerHeaderComponent,
		// updateSettings,
		registerSettingWatcher,
		unregisterSettingWatcher,
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

export function useFlowAction(selection: MaybeRefOrGetter<ActionSelection | undefined>) {
	const action = useAction(selection)

	return computed(() => {
		if (action.value?.type != "flow") return undefined
		return action.value
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

export function useColorsModified(
	colorProvider: MaybeRefOrGetter<{ color?: string } | undefined>,
	modify: MaybeRefOrGetter<boolean>
) {
	const defaultColor = "#3e3e3e"

	const color = computed(() => {
		const modified = toValue(modify)

		const baseColor = toValue(colorProvider)?.color ?? defaultColor

		const hsl = chromatism.convert(baseColor).hsl

		return !modified ? baseColor : chromatism.saturation(-(hsl.s * 0.85), baseColor).hex
	})
	const darkerColor = computed(() => chromatism.shade(-20, color.value).hex)
	const darkestColor = computed(() => chromatism.shade(-30, color.value).hex)
	const lighterColor = computed(() => chromatism.brightness(20, color.value).hex)

	return { color, darkerColor, darkestColor, lighterColor }
}

export function useActionColors(
	selection: MaybeRefOrGetter<ActionSelection | undefined>,
	floating: MaybeRefOrGetter<boolean>
) {
	const action = useAction(selection)

	const {
		color: actionColor,
		darkerColor: darkerActionColor,
		darkestColor: darkestActionColor,
		lighterColor: lighterActionColor,
	} = useColorsModified(action, floating)

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

export function useSettingValue<T = any>(settingSel: MaybeRefOrGetter<{ plugin: string; setting: string }>) {
	const pluginStore = usePluginStore()

	return computed(() => {
		const sel = toValue(settingSel)

		const plugin = pluginStore.pluginMap.get(sel.plugin)
		if (!plugin) return undefined

		const setting = plugin.settings[sel.setting]
		if (!setting) return undefined

		if (setting.type != "value") return undefined
		return setting.value as T
	})
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

export function useFullState() {
	const pluginStore = usePluginStore()

	return computed(() => {
		const fullState: Record<string, Record<string, any>> = {}

		for (const plugin of pluginStore.pluginMap.values()) {
			fullState[plugin.id] = {}

			for (const [key, state] of Object.entries(plugin.state)) {
				fullState[plugin.id][key] = state.value
			}
		}

		return fullState
	})
}

export function useFullSettings() {
	const pluginStore = usePluginStore()

	return computed(() => {
		const fullSettings: Record<string, Record<string, any>> = {}

		// for (const plugin of pluginStore.pluginMap.values()) {
		// 	fullSettings[plugin.id] = {}

		// 	for (const [key, state] of Object.entries(plugin.settings)) {
		// 		if (state.type == "value" || state.type == "secret") fullSettings[plugin.id][key] = state.value
		// 	}
		// }

		return fullSettings
	})
}

export function useSettingWatcher(watcher: SettingUpdateWatcher) {
	const pluginStore = usePluginStore()

	onMounted(() => {
		pluginStore.registerSettingWatcher(watcher)
	})

	onUnmounted(() => {
		pluginStore.unregisterSettingWatcher(watcher)
	})
}
