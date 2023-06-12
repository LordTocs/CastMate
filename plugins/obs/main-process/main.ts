import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	RegisterResource,
	defineResource,
	ResourceStorage,
} from "castmate-core"
import OBSWebSocket from "obs-websocket-js"

@RegisterResource
class OBSConnection extends defineResource({
	config: {
		type: Object,
		properties: {
			name: { type: String, required: true, default: "OBS" },
			host: { type: String, required: true, default: "localhost" },
			port: { type: Number, required: true, default: 4455 },
			default: { type: Boolean, required: true, default: false },
		},
	},
	state: {
		type: Object,
		properties: {
			connected: { type: Boolean, required: true, default: false },
			scene: { type: String },
		},
	},
}) {
	static storage = new ResourceStorage<OBSConnection>()

	connection: OBSWebSocket
}

export default definePlugin(
	{
		id: "obs",
		name: "OBS",
		description: "Provides OBS Control over OBS Websocket 5",
		icon: "mdi-pencil",
	},
	() => {
		onLoad(() => {})

		//Plugin Intiialization
		defineAction({
			id: "changeScene",
			name: "Change Scene",
			description: "Changes the current scene in OBS",
			icon: "mdi-swap",
			config: {
				type: Object,
				properties: {
					obs: { type: OBSConnection, name: "OBS Connection", required: true },
					scene: { type: String, name: "Scene", required: true },
				},
			},
			async invoke(config, contextData, abortSignal) {
				await config.obs.connection.call("SetCurrentProgramScene", { sceneName: config.scene })
			},
		})
	}
)
