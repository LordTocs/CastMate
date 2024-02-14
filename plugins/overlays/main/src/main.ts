import { defineAction, defineTrigger, onLoad, onUnload, definePlugin } from "castmate-core"
import { setupOverlayResources } from "./overlay-resource"

export default definePlugin(
	{
		id: "overlays",
		name: "Overlays",
		description: "Overlay Plugin",
		icon: "mdi mdi-web",
	},
	() => {
		setupOverlayResources()
	}
)
