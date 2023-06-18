import { defineStore } from "pinia"
import { ref } from "vue"

export const useInitializerStore = defineStore("initializer", () => {
	const inited = ref({})

	function isInitialized(id) {
		return inited.value[id]
	}

	function setInitialized(id) {
		inited.value[id] = true
	}

	return { isInitialized, setInitialized }
})

export function defineInitializableStore(id, options) {
	const useStore = defineStore(id, options)

	return () => {
		const initStore = useInitializerStore()
		const store = useStore()

		if (!initStore.isInitialized(id)) {
			store.init?.()
			initStore.setInitialized(id)
		}

		return store
	}
}
