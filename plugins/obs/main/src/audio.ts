import { ReactiveRef, defineAction } from "castmate-core"
import { OBSConnection } from "./connection"
import { Toggle } from "castmate-schema"

//Converts a slider position to DB value in exactly the same way OBS does it.
function sliderToDB(sliderPos: number) {
	const slider = Math.min(Math.max(sliderPos, 0), 100) / 100 //Change from 0 to 100 to 0 to 1

	if (slider == 1.0) return 0.0
	else if (slider <= 0.0) return -100.0

	//Offset and range to match OBS
	const offset = 6
	const range = 96

	let db = -(range + offset) * Math.pow((range + offset) / offset, -slider) + offset

	return db
}

export function setupAudio(obsDefault: ReactiveRef<OBSConnection>) {
	defineAction({
		id: "mute",
		name: "Mute Source",
		icon: "mdi mdi-volume-mute",
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
						return await context.obs.getInputs()
					},
				},
				muted: {
					type: Toggle,
					name: "Muted",
					required: true,
					default: true,
					template: true,
					trueIcon: "mdi mdi-volume-off",
					falseIcon: "mdi mdi-volume-high",
				},
			},
		},
		result: {
			type: Object,
			properties: {
				audioMuted: { type: Boolean, name: "Audio Muted", required: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			let muted = config.muted
			if (muted == "toggle") {
				const { inputMuted } = await config.obs.connection.call("GetInputMute", { inputName: config.source })
				muted = !inputMuted
			}

			await config.obs.connection.call("SetInputMute", { inputName: config.source, inputMuted: muted })

			return { audioMuted: muted }
		},
	})

	defineAction({
		id: "changeVolume",
		name: "Change Volume",
		icon: "mdi mdi-volume-high",
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
						return await context.obs.getInputs()
					},
				},
				volume: {
					type: Number,
					name: "Volume",
					required: true,
					default: 100,
					min: 0,
					max: 100,
					template: true,
					slider: true,
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			const db = sliderToDB(config.volume)
			await config.obs.connection.call("SetInputVolume", { inputName: config.source, inputVolumeDb: db })
		},
	})
}
