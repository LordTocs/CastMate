import { ProjectGroupItem, useDockingStore, useProjectStore } from "castmate-ui-core"
import { computed } from "vue"
import VariablesPageVue from "./components/VariablesPage.vue"
import { useVariableStore } from "./variable-store"

export async function initPlugin() {
	//Init Renderer Module
	const variableStore = useVariableStore()

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
					dockingStore.openPage("variables.variables", "Variables", VariablesPageVue)
				},
			}
		})
	)
}
