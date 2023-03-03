import { ipcRenderer } from "electron"
import _cloneDeep from "lodash/cloneDeep"
import { defineStore } from "pinia"
import { ref, computed } from "vue"

export const useAnalyticsStore = defineStore("analytics", () => {
	const id = ref(null)

	async function init() {
		ipcRenderer.on("analytics_setId", (event, twitchId) => {
			id.value = twitchId
		})
	}

	return { init, id: computed(() => id.value) }
})

export function trackAnalytic(eventName, data) {
	const id = useAnalyticsStore().id
	if (!id) return

	ipcRenderer.invoke(
		"analytics_track",
		_cloneDeep(eventName),
		_cloneDeep(data)
	)
}

export function setAnalytic(data) {
	const id = useAnalyticsStore().id
	if (!id) return

	ipcRenderer.invoke("analytics_set", data)
}
