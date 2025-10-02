import { definePluginOverlays } from "castmate-overlay-core"

import LabelVue from "./widgets/Label.vue"
import EmoteBouncer from "./widgets/EmoteBouncer.vue"
import Alert from "./widgets/Alert.vue"
import Bar from "./widgets/Bar.vue"
import LeaderBoard from "./widgets/LeaderBoard.vue"

export default definePluginOverlays({
	id: "overlays",
	widgets: [LabelVue, EmoteBouncer, Alert, Bar, LeaderBoard],
})
