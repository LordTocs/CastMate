import { definePluginOverlays } from "castmate-overlay-core"

import LabelVue from "./widgets/Label.vue"
import EmoteBouncer from "./widgets/EmoteBouncer.vue"

export default definePluginOverlays({
	id: "overlays",
	widgets: [LabelVue, EmoteBouncer],
})
