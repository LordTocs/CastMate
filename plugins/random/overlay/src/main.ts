import { definePluginOverlays } from "castmate-overlay-core"

import WheelVue from "./widgets/Wheel.vue"

export default definePluginOverlays({
	id: "random",
	widgets: [WheelVue],
})
