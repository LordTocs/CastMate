import { getResourceAsProjectGroup, useDocumentStore, useProjectStore, useResourceStore } from "castmate-ui-core"
import { App } from "vue"
import DashboardEditor from "./components/DashboardEditor.vue"

import _cloneDeep from "lodash/cloneDeep"
import { DashboardView } from "./dashboard-types"
import { ResourceData } from "castmate-schema"
import { DashboardConfig } from "castmate-plugin-dashboards-shared"
import { useDashboardRemoteConfigStore } from "./config/dashboard-config"

export function initPlugin(app: App<Element>) {
	const documentStore = useDocumentStore()

	const resourceStore = useResourceStore()

	documentStore.registerDocumentComponent("dashboard", DashboardEditor)
	documentStore.registerSaveFunction("dashboard", async (doc) => {
		const docDataCopy = _cloneDeep(doc.data)
		delete docDataCopy.name
		await resourceStore.applyResourceConfig("Dashboard", doc.id, docDataCopy)
	})

	const projectStore = useProjectStore()

	const dashboardGroup = getResourceAsProjectGroup(app, {
		resourceType: "Dashboard",
		resourceName: "Dashboards",
		groupIcon: "mdi mdi-view-dashboard",
		documentType: "dashboard",
		createView(resource: ResourceData<DashboardConfig>): DashboardView {
			return {
				scrollX: 0,
				scrollY: 0,
				pages: resource.config.pages.map((p) => {
					return {
						id: p.id,
						sections: p.sections.map((s) => {
							return {
								id: s.id,
								widgets: s.widgets.map((w) => {
									return {
										id: w.id,
									}
								}),
							}
						}),
					}
				}),
			}
		},
	})

	projectStore.registerProjectGroupItem(dashboardGroup)

	const configStore = useDashboardRemoteConfigStore()
	configStore.initialize()
}
