import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	ResourceStorage,
	Resource,
	defineState,
} from "castmate-core"
import { Toggle } from "castmate-schema"
import OBSWebSocket from "obs-websocket-js"

interface OBSConnectionConfig {
	name: string
	host: string
	port: number
}

interface OBSConnectionState {
	connected: boolean
	scene: string
}

class OBSConnection extends Resource<OBSConnectionConfig, OBSConnectionState> {
	static storage = new ResourceStorage<OBSConnection>("OBSConnection")

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

		const obsDefault = defineState("obsDefault", { type: OBSConnection, required: true })

		//Plugin Intiialization
		defineAction({
			id: "scene",
			name: "Change Scene",
			description: "Changes the current scene in OBS",
			icon: "mdi-swap-horizontal-bold",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						default: () => obsDefault.value,
					},
					scene: { type: String, name: "Scene", required: true },
				},
			},
			async invoke(config, contextData, abortSignal) {
				await config.obs.connection.call("SetCurrentProgramScene", { sceneName: config.scene })
			},
		})

		defineAction({
			id: "prevScene",
			name: "Previous Scene",
			description: "Go back to the previous scene.",
			icon: "mdi-skip-backward",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						default: () => obsDefault.value,
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				//await config.obs.connection.call("SetCurrentProgramScene", { sceneName: config.scene })
			},
		})

		defineAction({
			id: "filter",
			name: "OBS Filter",
			description: "Enable/Disable an OBS filter",
			icon: "mdi-eye",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						default: () => obsDefault.value,
					},
					sourceName: {
						type: String,
						template: true,
						name: "Source Name",
						required: true,
						async enum(context: { obs: OBSConnection }) {
							const obs = context.obs.connection

							const { inputs } = await obs.call("GetInputList")
							const { scenes } = await obs.call("GetSceneList")
							return [
								...inputs.map((i) => i.inputName as string),
								...scenes.map((s) => s.sceneName as string),
							]
						},
					},
					filterName: {
						type: String,
						name: "Filter Name",
						template: true,
						required: true,
						async enum(context: { obs: OBSConnection; sourceName: string }) {
							const obs = context.obs.connection

							const { filters } = await obs.call("GetSourceFilterList", {
								sourceName: context.sourceName,
							})

							return filters.map((f) => f.filterName as string)
						},
					},
					filterEnabled: {
						type: Toggle,
						name: "Filter Enabled",
						required: true,
						default: true,
						trueIcon: "mdi-eye-outline",
						falseIcon: "mdi-eye-off-outline",
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				const sourceName = config.sourceName
				const filterName = config.filterName

				let enabled = config.filterEnabled
				if (enabled == "toggle") {
					const { filterEnabled } = await this.obs.call("GetSourceFilter", { sourceName, filterName })
					enabled = !filterEnabled
				}

				await config.obs.connection.call("SetSourceFilterEnabled", {
					sourceName,
					filterName,
					filterEnabled: enabled,
				})
			},
		})

		defineAction({
			id: "source",
			name: "Source Visibility",
			icon: "mdi-eye",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						default: () => obsDefault.value,
					},
					scene: {
						type: String,
						required: true,
						name: "Scene",
						async enum(context: { obs: OBSConnection }) {
							const { scenes } = await context.obs.connection.call("GetSceneList")

							return scenes.map((s) => s.sceneName as string)
						},
					},
					source: {
						type: Number,
						name: "Source",
						required: true,
						async enum(context: { obs: OBSConnection; scene: string }) {
							const { sceneItems } = await context.obs.connection.call("GetSceneItemList", {
								sceneName: context.scene,
							})
							return sceneItems.map((s) => ({
								value: s.sceneItemId as number,
								name: s.sourceName as string,
							}))
						},
					},
					enabled: {
						type: Toggle,
						name: "Source Visible",
						required: true,
						default: true,
						trueIcon: "mdi-eye-outline",
						falseIcon: "mdi-eye-off-outline",
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				const sceneName = config.scene
				const sceneItemId = config.source

				let enabled = config.enabled
				if (enabled === "toggle") {
					const { sceneItemEnabled } = await this.obs.call("GetSceneItemEnabled", { sceneName, sceneItemId })
					enabled = !sceneItemEnabled
				}

				await config.obs.connection.call("SetSceneItemEnabled", {
					sceneName,
					sceneItemId,
					sceneItemEnabled: enabled,
				})
			},
		})
	}
)
