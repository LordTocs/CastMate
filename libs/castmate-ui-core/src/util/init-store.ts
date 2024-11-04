import { createDelayedResolver } from "castmate-schema"
import { ipcInvoke } from "./electron"
import { ipcRenderer } from "electron"
import { defineStore } from "pinia"
import { computed, ref, markRaw } from "vue"

export const useInitStore = defineStore("init", () => {
	const mainProcessInited = ref(false)
	const mainProcessInitialInited = ref(false)

	const mainProcessInitResolver = createDelayedResolver()
	const mainProcessInitialInitResolver = createDelayedResolver()

	async function initialize() {
		const isInited = await ipcInvoke("castmate_isSetupFinished")
		if (isInited) {
			mainProcessInited.value = true
			mainProcessInitResolver.resolve()
		}

		const isInitialInited = await ipcInvoke("castmate_isInitialSetupFinished")
		if (isInitialInited) {
			mainProcessInitialInited.value = true
			mainProcessInitialInitResolver.resolve()
		}
		//Check for init
		ipcRenderer.on("castmate_setupFinished", () => {
			mainProcessInited.value = true
			mainProcessInitResolver.resolve()
		})

		ipcRenderer.on("castmate_initialSetupFinished", () => {
			mainProcessInitialInited.value = true
			mainProcessInitialInitResolver.resolve()
		})
	}

	function waitForInit() {
		return mainProcessInitResolver.promise
	}

	function waitForInitialSetup() {
		return mainProcessInitialInitResolver.promise
	}

	return {
		inited: computed(() => mainProcessInited.value),
		initialize,
		waitForInitialSetup,
		waitForInit,
	}
})
