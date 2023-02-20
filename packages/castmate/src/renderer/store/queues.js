import { ipcRenderer } from "electron"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { useIpc } from "../utils/ipcMap"

export const useQueueStore = defineStore("queues", () => {
	const activeProfiles = ref([])

	const getActiveProfiles = useIpc("core", "getActiveProfiles")

	async function init() {
		activeProfiles.value = await getActiveProfiles()

		ipcRenderer.on("queues_setActiveProfiles", (event, profiles) => {
			activeProfiles.value = profiles
		})
	}

	return { init, activeProfiles: computed(() => activeProfiles.value) }
})
