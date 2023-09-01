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
} from "castmate-core"
import { MediaManager } from "castmate-core"
import { MediaFile } from "castmate-schema"
import { defineCallableIPC } from "castmate-core/src/util/electron"
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

const playSoundInRenderer = defineCallableIPC<(file: string, volume: number, sinkId: string) => string>(
	"sound",
	"playSoundInRenderer"
)

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
		await playSoundInRenderer(file, volume, this.config.deviceId)
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
		defineAction({
			id: "sound",
			name: "Sound",
			icon: "mdi mdi-volume-high",
			description: "Play Sound",
			type: "time",
			durationHandler: async (config) => {
				const media = MediaManager.getInstance().getMedia(config.sound)
				return media?.duration ?? 1
			},
			config: {
				type: Object,
				properties: {
					output: { type: SoundOutput, name: "Output", default: "system.default", required: true },
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
				},
			},
			async invoke(config, contextData, abortSignal) {
				const media = MediaManager.getInstance().getMedia(config.sound)
				if (!media) return
				config.output.playFile(media.file, config.volume, abortSignal)
			},
		})

		onLoad(() => {
			ResourceRegistry.getInstance().register(SoundOutput)
		})

		defineRendererCallable("setAudioOutputDevices", (devices: WebAudioDeviceInfo[]) => {
			for (const device of devices) {
				const existingResource = SoundOutput.storage.getById(`system.${device.deviceId}`)

				if (existingResource) {
				} else {
					//It's a new output
					const newOutput = new SystemSoundOutput(device)

					SoundOutput.storage.inject(newOutput)
				}
			}
		})
	}
)
