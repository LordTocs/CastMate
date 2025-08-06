import { ReactiveRef, defineAction, ensureDirectory } from "castmate-core"
import { OBSConnection } from "./connection"
import { Directory, Toggle } from "castmate-schema"
import path from "path"

export function setupSources(obsDefault: ReactiveRef<OBSConnection>) {
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
					default: () => obsDefault.value,
				},
				scene: {
					type: String,
					required: true,
					name: "Scene",
					template: true,
					async enum(context: { obs: OBSConnection }) {
						return (await context?.obs?.getSceneAndGroupNames()) ?? []
					},
				},
				source: {
					type: Number,
					name: "Source",
					required: true,
					template: true,
					async enum(context: { obs: OBSConnection; scene: string }) {
						if (!context.obs) return []

						return await context.obs.getSceneSources(context.scene)
					},
				},
				enabled: {
					type: Toggle,
					name: "Source Visibility",
					required: true,
					default: true,
					template: true,
					trueIcon: "mdi mdi-eye-outline",
					falseIcon: "mdi mdi-eye-off-outline",
				},
			},
		},
		result: {
			type: Object,
			properties: {
				sourceEnabled: { type: Boolean, name: "Source Enabled", required: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			const sceneName = config.scene
			const sceneItemId = config.source

			if (!config.obs) return { sourceEnabled: false }

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

			return { sourceEnabled: enabled }
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
					default: () => obsDefault.value,
				},
				sourceName: {
					type: String,
					//template: true,
					name: "Source Name",
					required: true,
					template: true,
					async enum(context: { obs: OBSConnection }) {
						const obs = context?.obs?.connection
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
					//template: true,
					required: true,
					template: true,
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
					template: true,
					trueIcon: "mdi mdi-eye-outline",
					falseIcon: "mdi mdi-eye-off-outline",
				},
			},
		},
		result: {
			type: Object,
			properties: {
				filterEnabled: { type: Boolean, name: "Filter Enabled", required: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			const sourceName = config.sourceName
			const filterName = config.filterName

			if (!config.obs) return { filterEnabled: false }

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

			return {
				filterEnabled: enabled,
			}
		},
	})

	defineAction({
		id: "screenshot",
		name: "Screenshot Source",
		icon: "mdi mdi-camera",
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
					name: "Source Name",
					template: true,
					async enum(context: { obs: OBSConnection }) {
						const obs = context?.obs?.connection
						if (!obs) return []

						const { inputs } = await obs.call("GetInputList")
						const { scenes } = await obs.call("GetSceneList")
						return [
							...inputs.map((i) => i.inputName as string),
							...scenes.map((s) => s.sceneName as string),
						]
					},
				},
				width: {
					type: Number,
					name: "Width",
					template: true,
				},
				height: {
					type: Number,
					name: "Height",
					template: true,
				},
				directory: {
					type: Directory,
					name: "Directory",
					required: true,
				},
				filename: {
					type: String,
					name: "Filename",
					default: "screenshot-{{ Date.now() }}.png",
					template: true,
					required: true,
				},
			},
		},
		result: {
			type: Object,
			properties: {
				screenshot: { type: String, required: true, name: "Screenshot File" },
			},
		},
		async invoke(config, contextData, abortSignal) {
			let ext = path.extname(config.filename)
			const basename = path.basename(config.filename, ext)

			//if (ext == "") {
			ext = ".png"
			//}

			await ensureDirectory(config.directory)

			const filename = path.join(config.directory, `${basename}${ext}`)

			//TODO: Check for other formats? JPG?

			let sourceName = config.sourceName
			if (!sourceName) {
				//HACK: We want to screenshot the stream output if there's no supplied source. However,
				// OBS Websocket doesn't have this feature. Instead we screenshot the active scene.
				// This can miss in progress transitions and downstream keyer elements.
				sourceName = config.obs.state.scene
			}

			const resp = await config.obs.connection.call("SaveSourceScreenshot", {
				sourceName,
				imageFormat: "png",
				imageFilePath: filename,
			})

			return {
				screenshot: filename,
			}
		},
	})

	defineAction({
		id: "text",
		name: "Set Source Text",
		icon: "mdi mdi-form-textbox",
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
					name: "Source Name",
					required: true,
					async enum(context: { obs: OBSConnection }) {
						const obs = context?.obs?.connection
						if (!obs) return []

						const textInputs = await context.obs.getInputs(["text_gdiplus_v2", "text_gdiplus_v3"])
						return textInputs
					},
				},
				text: {
					type: String,
					name: "Text",
					template: true,
					required: true,
					multiLine: true,
					default: "",
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			await config.obs.connection.call("SetInputSettings", {
				inputName: config.sourceName,
				inputSettings: {
					text: config.text,
				},
			})
		},
	})

	defineAction({
		id: "refreshBrowser",
		name: "Refresh Browser",
		icon: "mdi mdi-refresh",
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
					name: "Source Name",
					required: true,
					async enum(context: { obs: OBSConnection }) {
						const obs = context?.obs?.connection
						if (!obs) return []

						const textInputs = await context.obs.getInputs("browser_source")
						return textInputs
					},
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			if (!config.obs.state.connected) return

			await config.obs.connection.call("PressInputPropertiesButton", {
				inputName: config.sourceName,
				propertyName: "refreshnocache",
			})
		},
	})

	defineAction({
		id: "setBrowserURL",
		name: "Set Browser URL",
		icon: "mdi mdi-refresh",
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
					name: "Source Name",
					required: true,
					async enum(context: { obs: OBSConnection }) {
						const obs = context?.obs?.connection
						if (!obs) return []

						const textInputs = await context.obs.getInputs("browser_source")
						return textInputs
					},
				},
				url: {
					type: String,
					name: "URL",
					required: true,
					template: true,
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			if (!config.obs.state.connected) return

			await config.obs.connection.call("SetInputSettings", {
				inputName: config.sourceName,
				inputSettings: {
					url: config.url,
				},
			})
		},
	})
}
