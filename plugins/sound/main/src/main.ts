import {
	defineAction,
	onLoad,
	definePlugin,
	onUILoad,
	defineSetting,
	definePluginResource,
	probeMedia,
} from "castmate-core"
import { MediaManager } from "castmate-core"
import { Duration, MediaFile } from "castmate-schema"
import { RendererSoundPlayer } from "./renderer-sound-player"
import { AudioDeviceInterface } from "castmate-plugin-sound-native"
import { SoundOutput, setupOutput } from "./output"
import { TTSVoice, setupTTS } from "./tts"

export default definePlugin(
	{
		id: "sound",
		name: "Sound",
		color: "#62894F",
		description: "SOUND!",
		icon: "mdi mdi-volume-high",
	},
	() => {
		const globalVolume = defineSetting("globalVolume", {
			type: Number,
			name: "Global Volume",
			slider: true,
			min: 0,
			max: 100,
			required: true,
			default: 100,
		})

		setupOutput()
		setupTTS()

		defineAction({
			id: "sound",
			name: "Sound",
			icon: "mdi mdi-volume-high",
			description: "Play Sound",
			duration: {
				propDependencies: ["sound"],
				async callback(config) {
					const media = MediaManager.getInstance().getMedia(config.sound)
					const duration = media?.duration ?? 1
					return {
						indefinite: !media,
						dragType: "crop",
						leftSlider: {
							min: 0,
							max: duration,
							sliderProp: "startTime",
						},
						rightSlider: {
							min: 0,
							max: duration,
							sliderProp: "endTime",
						},
						duration: duration,
					}
				},
			},
			config: {
				type: Object,
				properties: {
					output: { type: SoundOutput, name: "Output", default: () => defaultOutput.value, required: true },
					sound: { type: MediaFile, name: "Sound", required: true, default: "", sound: true },
					volume: {
						type: Number,
						name: "Volume",
						required: true,
						default: 100,
						slider: true,
						min: 0,
						max: 100,
						step: 1,
					},
					startTime: { type: Duration, name: "Start Timestamp", required: true, default: 0 },
					endTime: { type: Duration, name: "End Timestamp" },
				},
			},
			async invoke(config, contextData, abortSignal) {
				const media = MediaManager.getInstance().getMedia(config.sound)
				if (!media) return
				const globalFactor = globalVolume.value / 100
				await config.output.playFile(
					media.file,
					config.startTime,
					config.endTime ?? media.duration ?? 0,
					config.volume * globalFactor,
					abortSignal
				)
			},
		})

		defineAction({
			id: "tts",
			name: "Text to Speech",
			icon: "mdi mdi-account-voice",
			config: {
				type: Object,
				properties: {
					output: { type: SoundOutput, name: "Output", default: () => defaultOutput.value, required: true },
					voice: { type: TTSVoice, name: "Voice", required: true, template: true },
					text: { type: String, name: "Text", required: true, template: true },
					volume: {
						type: Number,
						name: "Volume",
						required: true,
						default: 100,
						slider: true,
						min: 0,
						max: 100,
						step: 1,
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				const voiceFile = await config.voice?.generate(config.text)
				if (!voiceFile) return
				const globalFactor = globalVolume.value / 100

				const probeInfo = await probeMedia(voiceFile)

				let duration = probeInfo.format.duration as number | string | undefined

				let finalDuration = undefined
				if (duration && duration != "N/A") {
					finalDuration = Number(duration)
				}

				await config.output.playFile(
					voiceFile,
					0,
					finalDuration ?? Number.POSITIVE_INFINITY,
					config.volume * globalFactor,
					abortSignal
				)
			},
		})

		const defaultOutput = defineSetting("defaultOutput", {
			type: SoundOutput,
			name: "Default Sound Output",
			required: true,
			default: () => SoundOutput.storage.getById("system.default"),
		})
	}
)

export { SoundOutput }
