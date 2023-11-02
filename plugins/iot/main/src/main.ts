import { defineAction, defineTrigger, onLoad, onUnload, definePlugin } from "castmate-core"
import { setupLights, LightResource } from "./light"
import { setupPlugs, PlugResource } from "./plug"

export * from "./provider"

export { LightResource, PlugResource }

export default definePlugin(
	{
		id: "iot",
		name: "Lights & IoT",
		description: "UI Description",
		icon: "mdi mdi-lightbulb-on-outline",
		color: "#7F743F",
	},
	() => {
		//Plugin Intiialization
		setupLights()
		setupPlugs()
	}
)
