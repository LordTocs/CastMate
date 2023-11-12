import { createDelayedResolver } from "castmate-schema"
import { ipcInvoke } from "castmate-ui-core"
import { ipcRenderer } from "electron"
import { defineStore } from "pinia"
import { computed, ref, markRaw } from "vue"

export const useInitStore = defineStore("init", () => {
	const mainProcessInited = ref(false)

	const mainProcessInitResolver = createDelayedResolver()

	async function initialize() {
		const isInited = await ipcInvoke("castmate_isSetupFinished")
		if (isInited) {
			mainProcessInited.value = true
			mainProcessInitResolver.resolve()
		}
		//Check for init
		ipcRenderer.on("castmate_setupFinished", () => {
			mainProcessInited.value = true
			mainProcessInitResolver.resolve()
		})
	}

	function waitForInit() {
		return mainProcessInitResolver.promise
	}

	return {
		inited: computed(() => mainProcessInited.value),
		initialize,
		waitForInit,
	}
})
