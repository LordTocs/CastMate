import { definePluginDashboard } from "castmate-dashboard-core"

import Button from "./widgets/Button.vue"

export default definePluginDashboard({
	id: "dashboards",
	widgets: [Button],
})
