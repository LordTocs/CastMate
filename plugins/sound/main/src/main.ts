import { SoundOutputConfig, WebAudioDeviceInfo } from "castmate-plugin-sound-shared"
import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	Resource,
	ResourceStorage,
	defineRendererInvoker,
	onUILoad,
	defineRendererCallable,
	ResourceRegistry,
	defineSetting,
	definePluginResource,
} from "castmate-core"
import { MediaManager } from "castmate-core"
import { Duration, MediaFile, createDelayedResolver, DelayedResolver } from "castmate-schema"
import { defineCallableIPC } from "castmate-core/src/util/electron"
import { RendererSoundPlayer } from "./renderer-sound-player"
import { AudioDeviceInterface } from "castmate-plugin-sound-native"

class SoundOutput<
	ExtendedSoundConfig extends SoundOutputConfig = SoundOutputConfig
> extends Resource<ExtendedSoundConfig> {
	static storage = new ResourceStorage<SoundOutput>("SoundOutput")

	async playFile(file: string, volume: number, abortSignal: AbortSignal) {
		console.error("Don't enter here!")
		return false
	}
}

interface SystemSoundOutputConfig extends SoundOutputConfig {
	deviceId: string
}

class SystemSoundOutput extends SoundOutput<SystemSoundOutputConfig> {
	constructor(mediaDevice: WebAudioDeviceInfo) {
		super()
		this._id = `system.${mediaDevice.deviceId}`
		this._config = {
			deviceId: mediaDevice.deviceId,
			name: mediaDevice.label,
		}
	}

	async playFile(file: string, volume: number, abortSignal: AbortSignal): Promise<boolean> {
		await RendererSoundPlayer.getInstance().playSound(file, volume, this.config.deviceId, abortSignal)
		return true
	}
}

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
				await config.output.playFile(media.file, config.volume * globalFactor, abortSignal)
			},
		})

		definePluginResource(SoundOutput)

		let audioDeviceWaiter: DelayedResolver<any> | undefined

		let audioDeviceInterface: AudioDeviceInterface

		onLoad(async () => {
			audioDeviceInterface = new AudioDeviceInterface()

			const nativeDevices = audioDeviceInterface.getDevices()
			console.log(
				"AUDIO Devices",
				nativeDevices.filter((d) => d.type == "output")
			)

			audioDeviceInterface.on("device-added", (device) => {
				console.log("NEW NATIVE DEVICE", device)
			})

			audioDeviceInterface.on("device-removed", (deviceId) => {
				console.log("NATIVE DEVICE REMOVED", deviceId)
			})

			audioDeviceInterface.on("device-changed", (device) => {
				console.log("NATIVE DEVICE CHANGED", device)
			})

			audioDeviceWaiter = createDelayedResolver()
			RendererSoundPlayer.initialize()
			console.log("Waiting for audio devices...")
			await audioDeviceWaiter.promise
		})

		const defaultOutput = defineSetting("defaultOutput", {
			type: SoundOutput,
			name: "Default Sound Output",
			required: true,
			default: () => SoundOutput.storage.getById("system.default"),
		})

		defineRendererCallable("setAudioOutputDevices", async (devices: WebAudioDeviceInfo[]) => {
			for (const device of devices) {
				const existingResource = SoundOutput.storage.getById(`system.${device.deviceId}`)

				if (existingResource) {
				} else {
					//It's a new output
					const newOutput = new SystemSoundOutput(device)

					await SoundOutput.storage.inject(newOutput)
				}
			}
			if (audioDeviceWaiter) {
				audioDeviceWaiter.resolve(undefined)
				console.log("Audio Devices Received")
				audioDeviceWaiter = undefined
			}
		})
	}
)
