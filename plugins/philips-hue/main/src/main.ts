import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	defineSetting,
	autoRerun,
	onSettingChanged,
} from "castmate-core"
import { PhilipsHUELight, setupResources } from "./resources"
import { setupDiscovery } from "./discovery"
import { setupHueEvents } from "./events"

export default definePlugin(
	{
		id: "philips-hue",
		name: "Philips HUE",
		description: "",
		icon: "mdi-pencil",
	},
	() => {
		const hubIp = defineSetting("hubIp", {
			type: String,
			name: "Hue Hub IP",
		})

		const hubKey = defineSetting("hubKey", {
			type: String,
			name: "Hue Hub Key",
		})

		setupResources(hubIp, hubKey)
		setupDiscovery(hubIp, hubKey)
		setupHueEvents(hubIp, hubKey)
	}
)
