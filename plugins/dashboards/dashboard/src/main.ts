import { definePluginDashboard } from "castmate-dashboard-core"
import Label from "./widgets/Label.vue"

export default definePluginDashboard({
	id: "dashboards",
	widgets: [Label],
})
