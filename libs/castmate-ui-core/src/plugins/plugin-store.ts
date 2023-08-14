import { defineStore } from "pinia"

import { IPCActionDefinition, IPCPluginDefinition, IPCTriggerDefinition, Schema, Color, mapKeys } from "castmate-schema"

import { computed, ref, unref, type MaybeRefOrGetter, toValue } from "vue"

import * as chromatism from "chromatism2"
import { handleIpcMessage, useIpcCaller } from "../util/electron"
import { ipcParseSchema } from "../util/data"

interface ActionDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon?: string
	readonly color?: Color

	config: Schema
	result?: Schema
}

function ipcParseActionDefinition(def: IPCActionDefinition): ActionDefinition {
	const actionDef = {
		id: def.id,
		name: def.name,
		description: def.description,
		color: def.color,
		icon: def.icon,
		config: ipcParseSchema(def.config),
		...(def.result ? { result: ipcParseSchema(def.result) } : {}),
	}

	return actionDef
}

interface TriggerDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon?: string
	readonly color?: Color
	readonly version: string
	config: Schema
	context: Schema
}

function ipcParseTriggerDefinition(def: IPCTriggerDefinition): TriggerDefinition {
	const triggerDef = {
		id: def.id,
		name: def.name,
		description: def.description,
		icon: def.icon,
		color: def.color,
		version: def.version,
		config: ipcParseSchema(def.config),
		context: ipcParseSchema(def.context),
	}

	return triggerDef
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
	}

	return pluginDef
}

export const usePluginStore = defineStore("plugins", () => {
	const pluginMap = ref<Map<string, PluginDefinition>>(new Map())

	const getPluginIds = useIpcCaller<() => string[]>("plugins", "getPluginIds")
	const getPlugin = useIpcCaller<(id: string) => IPCPluginDefinition>("plugins", "getPlugin")

	async function initialize() {
		handleIpcMessage("plugins", "registerPlugin", (event, plugin: IPCPluginDefinition) => {
			pluginMap.value.set(plugin.id, ipcParsePluginDefinition(plugin))
		})

		handleIpcMessage("plugins", "unregisterPlugin", (event, id: string) => {
			pluginMap.value.delete(id)
		})

		const ids = await getPluginIds()

		const plugins = await Promise.all(ids.map((id) => getPlugin(id)))

		for (let i = 0; i < ids.length; ++i) {
			pluginMap.value.set(ids[i], ipcParsePluginDefinition(plugins[i]))
		}
	}

	return { pluginMap: computed(() => pluginMap.value), initialize }
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

	const style = computed(() => ({
		"--trigger-color": triggerColor.value,
		"--darker-trigger-color": darkerTriggerColor.value,
		"--darkest-trigger-color": darkestTriggerColor.value,
		"--lighter-trigger-color": lighterTriggerColor.value,
	}))

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
	const lighterColor = computed(() => chromatism.shade(20, color.value).hex)

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

	return { darkestActionColor, darkerActionColor, actionColor, lighterActionColor, actionColorStyle: style }
}
