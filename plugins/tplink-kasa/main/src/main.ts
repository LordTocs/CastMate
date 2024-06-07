import { defineAction, defineTrigger, onLoad, onUnload, definePlugin, defineSetting } from "castmate-core"
import { setupLights } from "./resources"

export default definePlugin(
	{
		id: "tplink-kasa",
		name: "TP-Link Kasa",
		icon: "iot iot-kasa",
		color: "#7F743F",
	},
	() => {
		const subnetMask = defineSetting("subnetMask", {
			type: String,
			required: true,
			name: "TP-Link Kasa Subnet Mask",
			default: "255.255.255.255",
		})

		setupLights(subnetMask)
	}
)
