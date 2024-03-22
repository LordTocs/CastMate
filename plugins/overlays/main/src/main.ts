import { definePlugin } from "castmate-core"

import { setupOverlayResources } from "./overlay-resource"
import { setupWebsockets } from "./websocket-bridge"

export default definePlugin(
	{
		id: "overlays",
		name: "Overlays",
		description: "Overlay Plugin",
		icon: "mdi mdi-web",
	},
	() => {
		setupOverlayResources()
		setupWebsockets()
	}
)
