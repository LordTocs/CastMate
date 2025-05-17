import { RetryTimer, definePluginResource, defineResourceSetting, usePluginLogger } from "castmate-core"
import { definePlugin } from "castmate-core"

import { setupMidiResources } from "./midi-resources"

export default definePlugin(
	{
		id: "midi",
		name: "MIDI",
		description: "Send and receive MIDI",
		icon: "mdi mdi-midi",
		color: "#66A87B",
	},
	() => {
		setupMidiResources()
	}
)
