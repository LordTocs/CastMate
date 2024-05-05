import { ReactiveRef, defineAction } from "castmate-core"
import { OBSConnection } from "./connection"
import { Toggle } from "castmate-schema"

export function setupToggles(obsDefault: ReactiveRef<OBSConnection>) {
	defineAction({
		id: "streamStartStop",
		name: "Stream Start/Stop",
		icon: "mdi mdi-broadcast",
		config: {
			type: Object,
			properties: {
				obs: {
					type: OBSConnection,
					name: "OBS Connection",
					required: true,
					default: () => obsDefault.value,
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
				await config.obs.connection.call("ToggleStream")
			} else if (config.streaming === true) {
				await config.obs.connection.call("StartStream")
			} else if (config.streaming === false) {
				await config.obs.connection.call("StopStream")
			}
		},
	})

	defineAction({
		id: "recordingStartStop",
		name: "Recording Start/Stop",
		icon: "mdi mdi-record",
		config: {
			type: Object,
			properties: {
				obs: {
					type: OBSConnection,
					name: "OBS Connection",
					required: true,
					default: () => obsDefault.value,
				},
				recording: {
					type: Toggle,
					name: "Recording",
					required: true,
					default: true,
					template: true,
					trueIcon: "mdi mdi-record",
					falseIcon: "mdi mdi-stop",
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			if (config.recording == "toggle") {
				await config.obs.connection.call("ToggleRecord")
			} else if (config.recording === true) {
				await config.obs.connection.call("StartRecord")
			} else if (config.recording === false) {
				await config.obs.connection.call("StopRecord")
			}
		},
	})

	defineAction({
		id: "virtualCamStartStop",
		name: "Virtual Cam Start/Stop",
		icon: "mdi mdi-webcam",
		config: {
			type: Object,
			properties: {
				obs: {
					type: OBSConnection,
					name: "OBS Connection",
					required: true,
					default: () => obsDefault.value,
				},
				virtualCam: {
					type: Toggle,
					name: "Virtual Camera",
					required: true,
					default: true,
					template: true,
					trueIcon: "mdi mdi-camera",
					falseIcon: "mdi mdi-camera-off",
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			if (config.virtualCam == "toggle") {
				await config.obs.connection.call("ToggleVirtualCam")
			} else if (config.virtualCam === true) {
				await config.obs.connection.call("StartVirtualCam")
			} else if (config.virtualCam === false) {
				await config.obs.connection.call("StopVirtualCam")
			}
		},
	})

	defineAction({
		id: "replayBufferStartStop",
		name: "Replay Buffer Start/Stop",
		icon: "mdi mdi-replay",
		config: {
			type: Object,
			properties: {
				obs: {
					type: OBSConnection,
					name: "OBS Connection",
					required: true,
					default: () => obsDefault.value,
				},
				replayBuffer: {
					type: Toggle,
					name: "Replay Buffer",
					required: true,
					default: true,
					template: true,
					trueIcon: "mdi mdi-record",
					falseIcon: "mdi mdi-stop",
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			if (config.replayBuffer == "toggle") {
				await config.obs.connection.call("ToggleReplayBuffer")
			} else if (config.replayBuffer === true) {
				await config.obs.connection.call("StartReplayBuffer")
			} else if (config.replayBuffer === false) {
				await config.obs.connection.call("StopReplayBuffer")
			}
		},
	})

	defineAction({
		id: "replaySave",
		name: "Save Replay Buffer",
		icon: "mdi mdi-content-save",
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
		result: {
			type: Object,
			properties: {
				replayFile: { type: String, required: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await config.obs.connection.call("SaveReplayBuffer")

			const { savedReplayPath } = await config.obs.connection.call("GetLastReplayBufferReplay")

			return {
				replayFile: savedReplayPath,
			}
		},
	})
}
