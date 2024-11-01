import { defineAction, defineTrigger, onLoad, onUnload, definePlugin, defineSatellitePlugin } from "castmate-core"
import { setupDashboardResources } from "./dashboard-resource"
import { DashboardWidgetManager } from "./dashboard-widgets"
import { setupConfigEval } from "./dashboard-config-eval"
import { DashboardAccessService } from "./dashboard-access"

export default definePlugin(
	{
		id: "dashboards",
		name: "Dashboards",
		description: "DASHBOARDS",
		icon: "mdi mdi-pencil",
	},
	() => {
		DashboardWidgetManager.initialize()

		setupConfigEval()

		setupDashboardResources()
	}
)

export const dashboardSatellite = defineSatellitePlugin(
	{
		id: "dashboards",
		name: "Dashboards",
		description: "DASHBOARDS",
		icon: "mdi mdi-pencil",
	},
	() => {
		DashboardAccessService.initialize()
	}
)
