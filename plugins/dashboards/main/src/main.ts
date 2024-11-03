import { defineAction, defineTrigger, onLoad, onUnload, definePlugin, defineSatellitePlugin } from "castmate-core"
import { Dashboard, setupDashboardResources } from "./dashboard-resource"
import { DashboardWidgetManager } from "./dashboard-widgets"
import { setupConfigEval } from "./dashboard-config-eval"
import { DashboardAccessService, setupDashboardSatellite } from "./dashboard-access"

export default definePlugin(
	{
		id: "dashboards",
		name: "Dashboards",
		description: "DASHBOARDS",
		icon: "mdi mdi-pencil",
	},
	() => {
		setupDashboardSatellite()

		setupConfigEval()

		setupDashboardResources()
	}
)

export async function finishInitDashboards() {
	await Dashboard.finishInitResourceSlots()
}

export const dashboardSatellite = defineSatellitePlugin(
	{
		id: "dashboards",
		name: "Dashboards",
		description: "DASHBOARDS",
		icon: "mdi mdi-pencil",
	},
	() => {
		onLoad(() => {
			DashboardWidgetManager.initialize()
			DashboardAccessService.initialize()
		})
	}
)
