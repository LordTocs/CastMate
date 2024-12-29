import { defineStore } from "pinia"
import { Component, computed, markRaw, ref } from "vue"

export const usePageStore = defineStore("page-store", () => {
	const page = ref("dashboard")

	const pageMap = ref(new Map<string, Component>())

	function registerPage(id: string, component: Component) {
		pageMap.value.set(id, markRaw(component))
	}

	function getPage(id: string) {
		return pageMap.value.get(id)
	}

	return {
		page,
		registerPage,
		getPage,
	}
})

export function useActivePage() {
	const pageStore = usePageStore()

	return computed(() => {
		return pageStore.getPage(pageStore.page)
	})
}
