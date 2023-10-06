import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	ResourceStorage,
	Resource,
	defineState,
	FileResource,
	definePluginResource,
	defineSetting,
} from "castmate-core"
import { Color, Toggle } from "castmate-schema"
import { OBSConnection, setupConnections } from "./connection"
import { setupSources } from "./sources"
import { setupScenes } from "./scenes"
import { setupMedia } from "./media"
import { setupToggles } from "./toggles"

export default definePlugin(
	{
		id: "obs",
		name: "OBS",
		description: "Provides OBS Control over OBS Websocket 5",
		color: "#607A7F",
		icon: "obsi obsi-obs",
	},
	() => {
		setupConnections()

		const obsDefault = defineSetting("obsDefault", {
			type: OBSConnection,
			name: "Default OBS Connection",
			required: true,
		})

		setupScenes(obsDefault)
		setupSources(obsDefault)
		setupMedia(obsDefault)
		setupToggles(obsDefault)
	}
)
