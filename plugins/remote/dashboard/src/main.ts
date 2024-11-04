import { definePluginDashboard } from "castmate-dashboard-core"

import Button from "./widgets/Button.vue"

export default definePluginDashboard({
	id: "remote",
	widgets: [Button],
})
