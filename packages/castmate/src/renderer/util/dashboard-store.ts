import { defineStore } from "pinia"
import { computed } from "vue"
import { ProjectItem, useDockingStore, useProjectStore } from "castmate-ui-core"
import DashboardPage from "../components/dashboard/DashboardPage.vue"

export const useDashboardStore = defineStore("dashboard", () => {
	const dockingStore = useDockingStore()
	const projectStore = useProjectStore()

	async function initialize() {
		const projectItem = computed<ProjectItem>(() => {
			return {
				id: "dashboard",
				title: "Dashboard",
				icon: "mdi mdi-view-dashboard",
				open() {
					dockingStore.openPage("dashboard", "Dashboard", DashboardPage)
				},
			}
		})

		projectStore.registerProjectGroupItem(projectItem)
	}

	return { initialize }
})
