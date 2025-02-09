import { ProjectGroupItem, useDockingStore, useProjectStore, useViewerDataStore } from "castmate-ui-core"
import { computed } from "vue"
import VariablesPageVue from "./components/VariablesPage.vue"
import { useVariableStore } from "./variable-store"
import ViewerVariablePage from "./components/viewer-data/ViewerVariablePage.vue"

export async function initPlugin() {
	//Init Renderer Module
	const variableStore = useVariableStore()
	const viewerVariableStore = useViewerDataStore()

	await variableStore.initialize()

	const projectStore = useProjectStore()
	const dockingStore = useDockingStore()

	projectStore.registerProjectGroupItem(
		computed<ProjectGroupItem>(() => {
			return {
				id: "variables",
				title: "Variables",
				icon: "mdi mdi-variable",
				open() {
					dockingStore.openPage("variables.variables", "Variables", "mdi mdi-variable", VariablesPageVue)
				},
			}
		})
	)

	const projectItem = computed<ProjectGroupItem>(() => {
		return {
			id: "viewer-variables",
			title: "Viewer Variables",
			icon: "mdi mdi-table-account",
			open() {
				dockingStore.openPage("viewer-data", "Viewer Variables", "mdi mdi-table-account", ViewerVariablePage)
			},
		}
	})

	projectStore.registerProjectGroupItem(projectItem)

	await viewerVariableStore.initialize()
}
