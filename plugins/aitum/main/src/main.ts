import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	useSetting,
	getSettingValue,
	defineTransformTrigger,
} from "castmate-core"
import { OBSConnection, onOBSWebsocketEvent } from "castmate-plugin-obs-main"
import { Command, getCommandDataSchema, matchAndParseCommand, Toggle } from "castmate-schema"

const aitumVerticalVendor = "aitum-vertical-canvas"

async function getVerticalScenes(obsConnection: OBSConnection) {
	if (!obsConnection.state.connected) return []

	try {
		const result = await obsConnection.connection.call("CallVendorRequest", {
			vendorName: aitumVerticalVendor,
			requestType: "get_scenes",
		})

		const scenes = (result.responseData?.scenes ?? []) as { name: string }[]
		return scenes.map((s) => s.name)
	} catch (err) {
		return []
	}
}

async function getVerticalStatus(obsConnection: OBSConnection) {
	if (!obsConnection.state.connected) return undefined

	try {
		const result = await obsConnection.connection.call("CallVendorRequest", {
			vendorName: aitumVerticalVendor,
			requestType: "status",
		})

		return result.responseData as {
			streaming: boolean
			recording: boolean
			backtrack: boolean
			virtual_camera: boolean
			success: boolean
		}
	} catch (err) {
		return undefined
	}
}

export default definePlugin(
	{
		id: "aitum",
		name: "Aitum",
		description: "Integration for Aitum OBS Plugins",
		color: "#256eff",
		icon: "atmi atmi-aitum",
	},
	() => {
		defineAction({
			id: "verticalScene",
			name: "Change Vertical Scene",
			icon: "mdi mdi-swap-horizontal-bold",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						default: () => getSettingValue<OBSConnection>("obs", "obsDefault"),
					},
					scene: {
						type: String,
						name: "Scene",
						required: true,
						//template: true,
						async enum(context: { obs: OBSConnection }) {
							return (await getVerticalScenes(context.obs)) ?? []
						},
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				await config.obs.connection.call("CallVendorRequest", {
					vendorName: aitumVerticalVendor,
					requestType: "switch_scene",
					requestData: {
						scene: config.scene,
					},
				})
			},
		})

		defineAction({
			id: "verticalStreamStartStop",
			name: "Vertical Stream Start/Stop",
			icon: "mdi mdi-broadcast",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						default: () => getSettingValue<OBSConnection>("obs", "obsDefault"),
					},
					streaming: {
						type: Toggle,
						name: "Streaming",
						required: true,
						default: true,
						template: true,
						trueIcon: "mdi mdi-broadcast",
						falseIcon: "mdi mdi-broadcast-off",
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				if (config.streaming == "toggle") {
					await config.obs.connection.call("CallVendorRequest", {
						vendorName: aitumVerticalVendor,
						requestType: "toggle_streaming",
					})
				} else if (config.streaming === true) {
					await config.obs.connection.call("CallVendorRequest", {
						vendorName: aitumVerticalVendor,
						requestType: "start_streaming",
					})
				} else if (config.streaming === false) {
					await config.obs.connection.call("CallVendorRequest", {
						vendorName: aitumVerticalVendor,
						requestType: "stop_streaming",
					})
				}
			},
		})

		defineAction({
			id: "verticalRecordingStartStop",
			name: "Vertical Recording Start/Stop",
			icon: "mdi mdi-record",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						default: () => getSettingValue<OBSConnection>("obs", "obsDefault"),
					},
					streaming: {
						type: Toggle,
						name: "Streaming",
						required: true,
						default: true,
						template: true,
						trueIcon: "mdi mdi-record",
						falseIcon: "mdi mdi-stop",
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				if (config.streaming == "toggle") {
					await config.obs.connection.call("CallVendorRequest", {
						vendorName: aitumVerticalVendor,
						requestType: "toggle_recording",
					})
				} else if (config.streaming === true) {
					await config.obs.connection.call("CallVendorRequest", {
						vendorName: aitumVerticalVendor,
						requestType: "start_recording",
					})
				} else if (config.streaming === false) {
					await config.obs.connection.call("CallVendorRequest", {
						vendorName: aitumVerticalVendor,
						requestType: "stop_recording",
					})
				}
			},
		})

		defineAction({
			id: "verticalBacktrackStartStop",
			name: "Vertical Backtrack Start/Stop",
			icon: "atmi atmi-aitum",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						default: () => getSettingValue<OBSConnection>("obs", "obsDefault"),
					},
					streaming: {
						type: Toggle,
						name: "Streaming",
						required: true,
						default: true,
						template: true,
						trueIcon: "mdi mdi-record",
						falseIcon: "mdi mdi-stop",
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				if (config.streaming == "toggle") {
					const status = await getVerticalStatus(config.obs)

					const requestType = status?.backtrack ? "stop_backtrack" : "start_backtrack"

					await config.obs.connection.call("CallVendorRequest", {
						vendorName: aitumVerticalVendor,
						requestType,
					})
				} else if (config.streaming === true) {
					await config.obs.connection.call("CallVendorRequest", {
						vendorName: aitumVerticalVendor,
						requestType: "start_backtrack",
					})
				} else if (config.streaming === false) {
					await config.obs.connection.call("CallVendorRequest", {
						vendorName: aitumVerticalVendor,
						requestType: "stop_backtrack",
					})
				}
			},
		})

		defineAction({
			id: "saveBacktrack",
			name: "Save Backtrack",
			description: "Saves the Vertical Backtrack",
			icon: "mdi mdi-content-save",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						default: () => getSettingValue<OBSConnection>("obs", "obsDefault"),
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				await config.obs.connection.call("CallVendorRequest", {
					vendorName: aitumVerticalVendor,
					requestType: "save_backtrack",
				})
			},
		})

		defineAction({
			id: "verticalChapterMarker",
			name: "Vertical Chapter Marker",
			description: "Creates a Chapter Marker in the Vertical OBS recording",
			icon: "mdi mdi-map-marker",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						default: () => getSettingValue<OBSConnection>("obs", "obsDefault"),
					},
					chapterName: {
						type: String,
						name: "Chapter Name",
						template: true,
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				await config.obs.connection.call("CallVendorRequest", {
					vendorName: aitumVerticalVendor,
					requestType: "add_chapter",
					requestData: {
						chapter_name: config.chapterName ?? "",
					},
				})
			},
		})
	}
)
