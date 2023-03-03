import { ipcRenderer } from "electron"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { useIpc } from "../utils/ipcMap"
import { defineInitializableStore } from "./initializer"

export const useSettingsStore = defineStore("settings", () => {
	const settingsStore = ref({})
	const secretsStore = ref({})

	const getSettings = useIpc("settings", "getSettings")
	const getSecrets = useIpc("settings", "getSecrets")

	async function init() {
		console.log("Initing Settings Store")

		ipcRenderer.on("settings_updateSettings", (event, settings) => {
			settingsStore.value = settings
		})

		ipcRenderer.on("settings_updateSecrets", (event, secrets) => {
			secretsStore.value = secrets
		})

		const [fullSettings, fullSecrets] = await Promise.all([
			getSettings(),
			getSecrets(),
		])

		settingsStore.value = fullSettings
		secretsStore.value = fullSecrets
	}

	const settings = computed(() => settingsStore.value)
	const secrets = computed(() => secretsStore.value)

	return { init, settings, secrets }
})
