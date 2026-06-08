import { definePlugin, defineSatellitePlugin } from "castmate-core"
import { LightService, useLightProvider, usePollingLightProvider } from "./light"
import { setupPlugs, PlugResource, PollingPlug } from "./plug"

export { LightService, useLightProvider, usePollingLightProvider }

// export default definePlugin(
// 	{
// 		id: "iot",
// 		name: "Lights & IoT",
// 		description: "UI Description",
// 		icon: "mdi mdi-lightbulb-on-outline",
// 		color: "#E2C74D",
// 	},
// 	() => {
// 		//Plugin Intiialization
// 		setupLights("castmate")
// 		setupPlugs("castmate")
// 	}
// )

// export const satelliteIoTPlugin = defineSatellitePlugin(
// 	{
// 		id: "iot",
// 		name: "Lights & IoT",
// 		description: "UI Description",
// 		icon: "mdi mdi-lightbulb-on-outline",
// 		color: "#E2C74D",
// 	},
// 	() => {
// 		//Plugin Intiialization
// 		setupLights("satellite")
// 		setupPlugs("satellite")
// 	}
// )
