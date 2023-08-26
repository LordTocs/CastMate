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
				console.log("Fetching Sound Length", config.sound)
				return config.sound?.length ?? 1
			},
			config: {
				type: Object,
				properties: {
					output: { type: SoundOutput, name: "Output", default: "system.default" },
					sound: { type: String, name: "Sound", required: true, default: "" },
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
					duration: { type: Number, name: "Duration", required: true, default: 3 },
				},
			},
			async invoke(config, contextData, abortSignal) {},
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