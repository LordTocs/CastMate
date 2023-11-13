import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	defineSetting,
	autoRerun,
	onSettingChanged,
	defineSecret,
} from "castmate-core"
import { PhilipsHUELight, setupResources } from "./resources"
import { setupDiscovery } from "./discovery"
import { setupHueEvents } from "./events"
import { defineSettingComponent } from "castmate-core/src/plugins/plugin"

export default definePlugin(
	{
		id: "philips-hue",
		name: "Philips HUE",
		icon: "iot iot-hue-sultan",
		color: "#7F743F",
	},
	() => {
		defineSettingComponent("hubSearch")

		const hubIp = defineSetting("hubIp", {
			type: String,
			name: "Hue Hub IP",
		})

		const hubKey = defineSecret("hubKey", {
			type: String,
			name: "Hue Hub Key",
		})

		setupResources(hubIp, hubKey)
		setupDiscovery(hubIp, hubKey)
		setupHueEvents(hubIp, hubKey)
	}
)
