import { ReactiveRef, abortableSleep, defineAction, sleep, usePluginLogger } from "castmate-core"
import { OBSConnection } from "./connection"
import { Toggle } from "castmate-schema"
import { OBSFFmpegSourceSettings } from "./input-settings"

export async function getMediaDuration(obs: OBSConnection, sourceName: string): Promise<number | undefined> {
	const resp = await obs.connection.call("GetMediaInputStatus", { inputName: sourceName })
	if (resp.mediaDuration != null) {
		return resp.mediaDuration / 1000
	}
	return undefined
}

//HACK HACK HACK HACK
export async function forceGetMediaDuration(obs: OBSConnection, sourceName: string): Promise<number | undefined> {
	//Check to see if we can get the duration
	let duration = await getMediaDuration(obs, sourceName)

	if (duration != null) return duration

	//Do the hack if we couldn't
	//Why does this work???
	//Best Guess: Asking for media restart even while not active will cause OBS to load the media
	await obs.connection.call("TriggerMediaInputAction", {
		inputName: sourceName,
		mediaAction: "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART",
	})

	for (let i = 0; i < 10; ++i) {
		duration = await getMediaDuration(obs, sourceName)
		if (duration != null) break

		await sleep(16)
	}

	return duration
}

export function setupMedia(obsDefault: ReactiveRef<OBSConnection>) {
	const logger = usePluginLogger()

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

	defineAction({
		id: "playMedia",
		name: "Play Media",
		icon: "mdi mdi-play",
		description: "Plays a media source from the beginning. Make sure close file when inactive is off.",
		duration: {
			propDependencies: ["obs", "scene", "source"],
			async callback(config) {
				try {
					const sceneItem = await config.obs.getSceneSource(config.scene, config.source)

					const duration = await forceGetMediaDuration(config.obs, sceneItem.sourceName)

					logger.log("Duration Detected: ", duration)

					return {
						indefinite: duration == null,
						dragType: "fixed",
						duration: duration ?? 1,
					}
				} catch (err) {
					//TODO: Cache Media Lengths??
					logger.error(err)

					return {
						indefinite: true,
						dragType: "fixed",
						duration: 1,
					}
				}
			},
		},
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
					required: true,
					async enum(context: { obs: OBSConnection }) {
						return (await context?.obs?.getSceneNames()) ?? []
					},
				},
				source: {
					type: Number,
					name: "Source",
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

			const startTime = Date.now()

			let duration: number | undefined = undefined

			for (let i = 0; i < 30; ++i) {
				duration = await getMediaDuration(config.obs, sceneItem.sourceName)

				if (duration != null) break

				await abortableSleep(16, abortSignal)
			}

			if (duration == null) {
				logger.error("Completely Unable to get Duration!")
				duration = 1
			}

			const now = Date.now()

			const remainingMs = startTime + duration * 1000 - now

			await abortableSleep(remainingMs, abortSignal, async () => {})

			await config.obs.connection.call("SetSceneItemEnabled", {
				sceneName: config.scene,
				sceneItemId: config.source,
				sceneItemEnabled: false,
			})
		},
	})
}
