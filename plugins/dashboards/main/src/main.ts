import { defineAction, defineTrigger, onLoad, onUnload, definePlugin } from "castmate-core"
import { setupDashboardResources } from "./dashboard-resource"
import { DashboardWidgetManager } from "./dashboard-widgets"

export default definePlugin(
	{
		id: "dashboards",
		name: "Dashboards",
		description: "DASHBOARDS",
		icon: "mdi mdi-pencil",
	},
	() => {
		//Plugin Intiialization
		DashboardWidgetManager.initialize()

		setupDashboardResources()
	}
)
