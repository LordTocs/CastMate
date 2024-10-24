import { defineAction, defineTrigger, onLoad, onUnload, definePlugin } from "castmate-core"
import { setupDashboardResources } from "./dashboard-resource"
import { DashboardWidgetManager } from "./dashboard-widgets"
import { setupConfigEval } from "./dashboard-config-eval"

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
