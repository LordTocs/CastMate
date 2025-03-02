import { defineStore } from "pinia"
import { computed } from "vue"
import { ProjectItem, useDockingStore, useProjectStore } from "castmate-ui-core"
import MainPage from "../components/main/MainPage.vue"

export const useMainPageStore = defineStore("main-page", () => {
	const dockingStore = useDockingStore()
	const projectStore = useProjectStore()

	function openMain() {
		dockingStore.openPage("dashboard", "CastMate", "mdi mdi-square", MainPage)
	}

	async function initialize() {
		const projectItem = computed<ProjectItem>(() => {
			return {
				id: "main-page",
				title: "CastMate",
				icon: "mdi mdi-square",
				open() {
					openMain()
				},
			}
		})

		projectStore.registerProjectGroupItem(projectItem)
	}

	return { initialize, openMain }
})
