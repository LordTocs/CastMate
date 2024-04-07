import { definePlugin } from "castmate-core"

import { setupOverlayResources } from "./overlay-resource"
import { setupWebsockets } from "./websocket-bridge"

import { OverlayTextStyle } from "castmate-plugin-overlays-shared"
import { setupEmoteBouncer } from "./emote-bouncer"
import { setupAlerts } from "./alerts"

export default definePlugin(
	{
		id: "overlays",
		name: "Overlays",
		description: "Overlay Plugin",
		color: "#CC63A2",
		icon: "mdi mdi-web",
	},
	() => {
		//Do not remove, forces bundler to init Overlay-Shared module
		OverlayTextStyle

		setupOverlayResources()
		setupAlerts()
		setupWebsockets()
		setupEmoteBouncer()
	}
)

export { OverlayWebsocketService } from "./websocket-bridge"
