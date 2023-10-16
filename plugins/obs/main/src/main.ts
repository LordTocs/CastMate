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
	defineResourceSetting,
	defineReactiveState,
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

		defineResourceSetting(OBSConnection, "OBS Connections")

		defineReactiveState(
			"scene",
			{
				type: String,
				name: "Scene",
				required: true,
				async enum() {
					return await obsDefault.value.getSceneNames()
				},
			},
			() => {
				return obsDefault.value.state.scene
			}
		)

		defineReactiveState(
			"streaming",
			{
				type: Boolean,
				name: "Streaming",
				required: true,
			},
			() => {
				return obsDefault.value.state.streaming
			}
		)

		defineReactiveState(
			"recording",
			{
				type: Boolean,
				name: "Recording",
				required: true,
			},
			() => {
				return obsDefault.value.state.recording
			}
		)

		defineReactiveState(
			"replayBuffering",
			{
				type: Boolean,
				name: "Replay Buffering",
				required: true,
			},
			() => {
				return obsDefault.value.state.replayBuffering
			}
		)

		defineReactiveState(
			"virtualCamming",
			{
				type: Boolean,
				name: "Virtual Cam Active",
				required: true,
			},
			() => {
				return obsDefault.value.state.virtualCamming
			}
		)

		defineReactiveState(
			"connected",
			{
				type: Boolean,
				name: "Connected",
				required: true,
			},
			() => {
				return obsDefault.value.state.connected
			}
		)

		setupScenes(obsDefault)
		setupSources(obsDefault)
		setupMedia(obsDefault)
		setupToggles(obsDefault)
	}
)
