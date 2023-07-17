import { defineStore } from "pinia"

import { PluginData } from "castmate-schema"

import { computed, unref, type MaybeRefOrGetter, toValue } from "vue"

export const usePluginStore = defineStore("plugins", () => {
	const pluginMap: Map<string, PluginData> = new Map()

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
				icon: "mdi-pencil",
				color: "#8DC1C0",
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
		},
		triggers: {
			test: {
				id: "test",
				name: "Test",
				description: "Testing a trigger",
				icon: "Blarg",
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
				icon: "Blarg",
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

	return { pluginMap: computed(() => pluginMap) }
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
