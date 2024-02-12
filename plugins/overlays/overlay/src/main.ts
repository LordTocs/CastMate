import { definePluginOverlays } from "castmate-overlay-core"

import LabelVue from "./widgets/Label.vue"

export default definePluginOverlays({
	id: "overlays",
	widgets: [LabelVue],
})
