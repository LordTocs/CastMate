import { definePluginOverlays } from "castmate-overlay-core"
import EmoteBouncer from "./widgets/EmoteBouncer.vue"

export default definePluginOverlays({
	id: "twitch",
	widgets: [EmoteBouncer],
})
