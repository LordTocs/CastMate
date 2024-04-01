import { definePlugin } from "castmate-core"

import { setupOverlayResources } from "./overlay-resource"
import { setupWebsockets } from "./websocket-bridge"

import { OverlayTextStyle } from "castmate-plugin-overlays-shared"

export default definePlugin(
	{
		id: "overlays",
		name: "Overlays",
		description: "Overlay Plugin",
		icon: "mdi mdi-web",
	},
	() => {
		//Do not remove, forces bundler to init Overlay-Shared module
		OverlayTextStyle

		setupOverlayResources()
		setupWebsockets()
	}
)

export { OverlayWebsocketService } from "./websocket-bridge"
