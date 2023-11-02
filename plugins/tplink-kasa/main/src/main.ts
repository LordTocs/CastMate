import { defineAction, defineTrigger, onLoad, onUnload, definePlugin, defineSetting } from "castmate-core"
import { setupLights } from "./resources"

export default definePlugin(
	{
		id: "tplink-kasa",
		name: "TP-Link Kasa",
		description: "UI Description",
		icon: "mdi-pencil",
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
