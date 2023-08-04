import { defineStore } from "pinia"

import { IPCPluginDefinition } from "castmate-schema"

import { computed, ref, unref, type MaybeRefOrGetter, toValue } from "vue"

import * as chromatism from "chromatism2"
import { handleIpcMessage, useIpcCaller } from "../util/electron"

export const usePluginStore = defineStore("plugins", () => {
	const pluginMap = ref<Map<string, IPCPluginDefinition>>(new Map())

	const getPluginIds = useIpcCaller<() => string[]>("plugins", "getPluginIds")
	const getPlugin = useIpcCaller<(id: string) => IPCPluginDefinition>("plugins", "getPlugin")

	/*
	pluginMap.set("castmate", {
		id: "castmate",
		name: "CastMate",
		icon: "mdi-pencil",
		color: "#8DC1C0",
		actions: {
			delay: {
				id: "delay",
				name: "Delay",
				description: "Delays",
				icon: "mdi-timer-sand",
				color: "#8DC1C0",
				type: "time",
				config: {
					type: Object,
					properties: {
						str: { type: String, name: "String Value" },
						str2: { type: String, name: "String Value 2!" },
						num: { type: Number, name: "Number Value" },
						bool: { type: Boolean, name: "Boolean Value" },
					},
				},
			},
			blah: {
				id: "blah",
				name: "Chat",
				description: "Blahs",
				icon: "mdi-chat",
				color: "#5E5172",
				type: "instant",
				config: {
					type: Object,
					properties: {
						num: { type: Number, name: "Number Value" },
					},
				},
			},
			tts: {
				id: "tts",
				name: "TTS",
				description: "Blahs",
				icon: "mdi-account-voice",
				color: "#62894F",
				type: "time-indefinite",
				config: {
					type: Object,
					properties: {
						duration: { type: Number, name: "Duration" },
						num: { type: Number, name: "Number Value" },
					},
				},
			},
		},
		triggers: {
			test: {
				id: "test",
				name: "Test",
				description: "Testing a trigger",
				icon: "mdi-star",
				color: "#8DC1C0",
				config: {
					type: Object,
					properties: {
						str: { type: String, name: "String Value", template: true },
						str2: { type: String, name: "String Value 2!" },
						num: { type: Number, name: "Number Value", template: true, unit: "m" },
						bool: { type: Boolean, name: "Boolean Value" },
					},
				},
			},
			fake: {
				id: "fake",
				name: "Fake",
				description: "Faking a Trigger",
				icon: "mdi-pencil",
				color: "#5E5172",
				config: {
					type: Object,
					properties: {
						num: { type: Number, name: "Number Value", template: true, unit: "m" },
					},
				},
			},
		},
	})
*/
	async function initialize() {
		handleIpcMessage("plugins", "registerPlugin", (event, plugin: IPCPluginDefinition) => {
			pluginMap.value.set(plugin.id, plugin)
		})

		handleIpcMessage("plugins", "unregisterPlugin", (event, id: string) => {
			pluginMap.value.delete(id)
		})

		const ids = await getPluginIds()

		const plugins = await Promise.all(ids.map((id) => getPlugin(id)))

		for (let i = 0; i < ids.length; ++i) {
			pluginMap.value.set(ids[i], plugins[i])
		}
	}

	return { pluginMap: computed(() => pluginMap.value), initialize }
})

export function usePlugin(id: MaybeRefOrGetter<string>) {
	const pluginStore = usePluginStore()
	return computed(() => pluginStore.pluginMap.get(toValue(id)))
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

	const colorProvValue = toValue(colorProvider)

	const color = computed(() => colorProvValue?.color ?? defaultColor)
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
