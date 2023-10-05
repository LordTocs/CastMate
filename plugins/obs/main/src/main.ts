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

export default definePlugin(
	{
		id: "obs",
		name: "OBS",
		description: "Provides OBS Control over OBS Websocket 5",
		color: "#607A7F",
		icon: "mdi mdi-pencil",
	},
	() => {
		setupConnections()

		const obsDefault = defineSetting("obsDefault", {
			type: OBSConnection,
			name: "Default OBS Connection",
			required: true,
		})

		//Plugin Intiialization
		defineAction({
			id: "scene",
			name: "Change Scene",
			description: "Changes the current scene in OBS",
			icon: "mdi mdi-swap-horizontal-bold",
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
						name: "Scene",
						required: true,
						async enum(context: { obs: OBSConnection }) {
							if (!context?.obs) return []

							return await context.obs.getSceneNames()
						},
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				if (!config.obs) return
				await config.obs.connection.call("SetCurrentProgramScene", { sceneName: config.scene })
			},
		})

		defineAction({
			id: "prevScene",
			name: "Previous Scene",
			description: "Go back to the previous scene.",
			icon: "mdi mdi-skip-backward",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						//default: () => obsDefault.value,
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				if (!config.obs) return
				await config.obs.popScene()
			},
		})

		defineAction({
			id: "source",
			name: "Source Visibility",
			icon: "mdi mdi-eye",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						//default: () => obsDefault.value,
					},
					scene: {
						type: String,
						required: true,
						name: "Scene",
						async enum(context: { obs: OBSConnection }) {
							return (await context?.obs?.getSceneNames()) ?? []
						},
					},
					source: {
						type: Number,
						name: "Source",
						required: true,
						async enum(context: { obs: OBSConnection; scene: string }) {
							if (!context.obs) return []

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
						name: "Source Visibility",
						required: true,
						default: true,
						trueIcon: "mdi mdi-eye-outline",
						falseIcon: "mdi mdi-eye-off-outline",
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				const sceneName = config.scene
				const sceneItemId = config.source

				if (!config.obs) return

				let enabled = config.enabled
				if (enabled === "toggle") {
					const { sceneItemEnabled } = await config.obs.connection.call("GetSceneItemEnabled", {
						sceneName,
						sceneItemId,
					})
					enabled = !sceneItemEnabled
				}

				await config.obs.connection.call("SetSceneItemEnabled", {
					sceneName,
					sceneItemId,
					sceneItemEnabled: enabled,
				})
			},
		})

		defineAction({
			id: "filter",
			name: "Filter Visibility",
			description: "Enable/Disable an OBS filter",
			icon: "mdi mdi-eye",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						//default: () => obsDefault.value,
					},
					sourceName: {
						type: String,
						template: true,
						name: "Source Name",
						required: true,
						async enum(context: { obs: OBSConnection }) {
							const obs = context.obs?.connection
							if (!obs) return []

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
							const obs = context.obs?.connection
							if (!obs) return []

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
						trueIcon: "mdi mdi-eye-outline",
						falseIcon: "mdi mdi-eye-off-outline",
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				const sourceName = config.sourceName
				const filterName = config.filterName

				if (!config.obs) return

				let enabled = config.filterEnabled
				if (enabled == "toggle") {
					const { filterEnabled } = await config.obs.connection.call("GetSourceFilter", {
						sourceName,
						filterName,
					})
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
			id: "recording",
			name: "Recording Start/Stop",
			icon: "mdi mdi-record",
			config: {
				type: Object,
				properties: {
					recording: {
						type: Toggle,
						name: "Recording",
						required: true,
						default: true,
						trueIcon: "mdi mdi-record",
						falseIcon: "mdi mdi-stop",
					},
				},
			},
			async invoke(config, contextData, abortSignal) {},
		})
	}
)
