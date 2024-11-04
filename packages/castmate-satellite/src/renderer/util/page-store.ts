import { defineStore } from "pinia"
import { ref } from "vue"

export const usePageStore = defineStore("page-store", () => {
	const page = ref("dashboard")

	return {
		page,
	}
})
