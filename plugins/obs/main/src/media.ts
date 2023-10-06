import { ReactiveRef, abortableSleep, defineAction } from "castmate-core"
import { OBSConnection } from "./connection"
import { Toggle } from "castmate-schema"
import { OBSFFmpegSourceSettings } from "./input-settings"

export async function getMediaDuration(obs: OBSConnection, sourceName: string) {
	const resp = await obs.connection.call("GetMediaInputStatus", { inputName: sourceName })
	return resp.mediaDuration
}

export function setupMedia(obsDefault: ReactiveRef<OBSConnection>) {
	defineAction({
		id: "mediaAction",
		name: "Media Controls",
		description: "Play, Pause, and Stop media sources.",
		icon: "mdi mdi-play-pause",
		config: {
			type: Object,
			properties: {
				obs: {
					type: OBSConnection,
					name: "OBS Connection",
					required: true,
					default: () => obsDefault.value,
				},
				source: {
					type: String,
					template: true,
					name: "Source",
					required: true,
					async enum(context: { obs: OBSConnection }) {
						return await context.obs.getInputs(["ffmpeg_source", "vlc_source"])
					},
				},
				action: {
					name: "Media Action",
					type: String,
					enum: ["Play", "Pause", "Restart", "Stop", "Next", "Previous"],
					required: true,
					default: "Play",
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			let mediaAction = null

			if (config.action == "Play") {
				mediaAction = "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PLAY"
			} else if (config.action == "Pause") {
				mediaAction = "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PAUSE"
			} else if (config.action == "Restart") {
				mediaAction = "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART"
			} else if (config.action == "Stop") {
				mediaAction = "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP"
			} else if (config.action == "Next") {
				mediaAction = "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_NEXT"
			} else if (config.action == "Previous") {
				mediaAction = "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PREVIOUS"
			}

			if (mediaAction == null) return

			await config.obs?.connection?.call("TriggerMediaInputAction", { inputName: config.source, mediaAction })
		},
	})
	/*
	Typescript HATES this for some reason. The type deduction begins to fail with the inclusion of a duration config.
	Additionally, OBS can fail to return media duration. It will succeed if the media is playing (or possibly loaded?)

	defineAction({
		id: "playMedia",
		name: "Play Media",
		description: "Plays a media source from the beginning",

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
					name: "Scene",
					type: String,
					template: true,
					required: true,
					async enum(context: { obs: OBSConnection }) {
						return (await context?.obs?.getSceneNames()) ?? []
					},
				},
				source: {
					type: Number,
					name: "Source",
					template: true,.
					required: true,
					async enum(context: { scene: string; obs: OBSConnection }) {
						return await context.obs.getSceneSources(context.scene, "ffmpeg_source")
					},
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			const sceneItem = await config.obs.getSceneSource(config.scene, config.source)
			if (!sceneItem) return

			if (!sceneItem.sceneItemEnabled) {
				//Enable it if it's not
				await config.obs.connection.call("SetSceneItemEnabled", {
					sceneName: config.scene,
					sceneItemId: config.source,
					sceneItemEnabled: true,
				})
			}

			await config.obs.connection.call("TriggerMediaInputAction", {
				inputName: sceneItem.sourceName,
				mediaAction: "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART",
			})

			const duration = await getMediaDuration(config.obs, sceneItem.sourceName)

			await abortableSleep(duration || 1000, abortSignal, async () => {})

			if (!sceneItem.sceneItemEnabled) {
				await config.obs.connection.call("SetSceneItemEnabled", {
					sceneName: config.scene,
					sceneItemId: config.source,
					sceneItemEnabled: false,
				})
			}
		},
	})*/
}
