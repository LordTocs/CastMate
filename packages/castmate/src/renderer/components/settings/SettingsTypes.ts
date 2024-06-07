import _cloneDeep from "lodash/cloneDeep"
import { SettingsChange, useDockingStore, useDocumentStore, usePluginStore } from "castmate-ui-core"
import SettingsPageVue from "./SettingsPage.vue"

export interface SettingsDocumentData {
	name: string
	settings: {
		[pluginId: string]: Record<string, any>
	}
}

export interface SettingsViewData {
	scrollX: number
	scrollY: number
	filter: string
}

export function initSettingsDocuments() {
	const documentStore = useDocumentStore()
	const pluginStore = usePluginStore()

	documentStore.registerDocumentComponent("settings", SettingsPageVue)
	documentStore.registerSaveFunction("settings", async (doc) => {
		const changes: SettingsChange[] = []

		for (const plugin of pluginStore.pluginMap.values()) {
			for (const settingId in plugin.settings) {
				const setting = plugin.settings[settingId]
				if (setting.type != "value" && setting.type != "secret") continue
				const newValue = doc.data.settings[plugin.id][settingId]
				const oldValue = setting.value
				if (newValue != oldValue) {
					changes.push({
						pluginId: plugin.id,
						settingId,
						value: newValue,
					})
				}
			}
		}

		console.log("Update Changes", changes)

		await pluginStore.updateSettings(changes)
	})
}

export function useOpenSettings() {
	const dockingStore = useDockingStore()
	const pluginStore = usePluginStore()

	return function () {
		const model: SettingsDocumentData = {
			name: "Settings",
			settings: {},
		}

		for (const plugin of pluginStore.pluginMap.values()) {
			model.settings[plugin.id] = {}

			for (const settingId in plugin.settings) {
				console.log(plugin.id, settingId)
				const setting = plugin.settings[settingId]
				if (setting.type == "value" || setting.type == "secret") {
					model.settings[plugin.id][settingId] = _cloneDeep(setting.value)
				}
			}
		}

		console.log(model)

		dockingStore.openDocument("settings", model, { scrollX: 0, scrollY: 0, filter: "" }, "settings")
	}
}
