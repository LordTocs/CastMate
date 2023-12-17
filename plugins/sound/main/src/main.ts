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
	PluginManager,
} from "castmate-core"
import { MediaManager } from "castmate-core"
import { Duration, MediaFile, createDelayedResolver, DelayedResolver } from "castmate-schema"
import { defineCallableIPC, defineIPCRPC } from "castmate-core/src/util/electron"
import { RendererSoundPlayer } from "./renderer-sound-player"
import { AudioDevice, AudioDeviceInterface } from "castmate-plugin-sound-native"

class SoundOutput<
	ExtendedSoundConfig extends SoundOutputConfig = SoundOutputConfig
> extends Resource<ExtendedSoundConfig> {
	static storage = new ResourceStorage<SoundOutput>("SoundOutput")

	async playFile(file: string, startSec: number, endSec: number, volume: number, abortSignal: AbortSignal) {
		console.error("Don't enter here!")
		return false
	}
}

interface SystemSoundOutputConfig extends SoundOutputConfig {
	deviceId: string
	webId?: string
	isDefault: boolean
}

class SystemSoundOutput extends SoundOutput<SystemSoundOutputConfig> {
	constructor(mediaDevice: AudioDevice | "chat" | "main", defaultDevice?: AudioDevice) {
		super()
		if (typeof mediaDevice == "string") {
			if (!defaultDevice) throw new Error("Default Requires AudioDevice")

			const id = mediaDevice == "main" ? "default" : "communications"
			this._id = `system.${id}`
			this._config = {
				isDefault: true,
				deviceId: id,
				name:
					mediaDevice == "main"
						? `Default - ${defaultDevice.name}`
						: `Communications - ${defaultDevice.name}`,
				webId: id,
			}
		} else {
			this._id = `system.${mediaDevice.id}`
			this._config = {
				isDefault: false,
				deviceId: mediaDevice.id,
				name: mediaDevice.name,
			}

			this.queryWebId()
		}
	}

	async queryWebId() {
		if (!PluginManager.getInstance().isUILoaded) return
		if (this.config.isDefault) return

		try {
			const webId = await getOutputWebId(this.config.name)
			//console.log("Got WebId", this.config.name, webId)
			await this.applyConfig({
				webId: webId,
			})
		} catch (err) {}
	}

	async setDefault(device: AudioDevice) {
		if (device.state != "active" || device.type != "output") throw new Error("Default Device Invalid")

		await this.applyConfig({
			name: this.id == "system.default" ? `Default - ${device.name}` : `Communications - ${device.name}`,
		})
	}

	async playFile(
		file: string,
		startSec: number,
		endSec: number,
		volume: number,
		abortSignal: AbortSignal
	): Promise<boolean> {
		if (!this.config.webId) return false
		await RendererSoundPlayer.getInstance().playSound(
			file,
			startSec,
			endSec,
			volume,
			this.config.webId,
			abortSignal
		)
		return true
	}
}

const getOutputWebId = defineIPCRPC<(name: string) => string | undefined>("sound", "getOutputWebId")

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
				await config.output.playFile(
					media.file,
					config.startTime,
					config.endTime ?? media.duration ?? 0,
					config.volume * globalFactor,
					abortSignal
				)
			},
		})

		definePluginResource(SoundOutput)

		let audioDeviceInterface: AudioDeviceInterface

		onUILoad(async () => {
			for (const output of SoundOutput.storage) {
				if (!output.id.startsWith("system")) continue
				const systemOutput = output as SystemSoundOutput
				systemOutput.queryWebId()
			}
		})

		onLoad(async () => {
			audioDeviceInterface = new AudioDeviceInterface()

			const nativeDevices = audioDeviceInterface.getDevices()

			const mainOutput = audioDeviceInterface.getDefaultOutput("main")
			const commOutput = audioDeviceInterface.getDefaultOutput("chat")

			const defaultOutput = new SystemSoundOutput("main", mainOutput)
			const defaultComm = new SystemSoundOutput("chat", commOutput)
			await SoundOutput.storage.inject(defaultOutput)
			await SoundOutput.storage.inject(defaultComm)

			for (const device of nativeDevices) {
				if (device.state != "active" || device.type != "output") continue

				const output = new SystemSoundOutput(device)
				await SoundOutput.storage.inject(output)
			}

			audioDeviceInterface.on("device-added", async (device) => {
				if (device.state == "active" && device.type == "output") {
					const new_device = new SystemSoundOutput(device)
					await SoundOutput.storage.inject(new_device)
				}
			})

			audioDeviceInterface.on("device-removed", async (deviceId) => {
				await SoundOutput.storage.remove(`system.${deviceId}`)
			})

			audioDeviceInterface.on("device-changed", async (device) => {
				const existing = SoundOutput.storage.getById(`system.${device.id}`)

				if (!existing) {
					if (device.state == "active" && device.type == "output") {
						const new_device = new SystemSoundOutput(device)
						await SoundOutput.storage.inject(new_device)
					}
				} else {
					if (device.state != "active") {
						await SoundOutput.storage.remove(existing.id)
					} else {
						await existing.applyConfig({
							name: device.name,
						})
					}
				}
			})

			audioDeviceInterface.on("default-output-changed", async (type, device) => {
				if (type == "main") {
					const existing = SoundOutput.storage.getById("system.default")
					if (!existing) return
					const systemOut = existing as SystemSoundOutput
					systemOut.setDefault(device)
				} else if (type == "chat") {
					const existing = SoundOutput.storage.getById("system.communications")
					if (!existing) return
					const systemOut = existing as SystemSoundOutput
					systemOut.setDefault(device)
				}
			})

			RendererSoundPlayer.initialize()
		})

		const defaultOutput = defineSetting("defaultOutput", {
			type: SoundOutput,
			name: "Default Sound Output",
			required: true,
			default: () => SoundOutput.storage.getById("system.default"),
		})
	}
)
