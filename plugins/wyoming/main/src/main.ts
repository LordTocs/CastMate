import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	usePluginLogger,
	defineSetting,
} from "castmate-core"
import {
	closeWyomingConnection,
	connectToWyomingServer,
	getWyomingDescription,
	readWyomingEvent,
	sendWyomingEvent,
	synthesizeWyomingTTS,
	writeData,
	WyomingConnection,
	WyomingTTSVoice,
} from "./api/wyoming-connection"
import { TTSVoiceProvider } from "castmate-plugin-sound-main"
import { declareSchema, Schema } from "castmate-schema"
import { createWriteStream } from "node:fs"

let socket: WyomingConnection | undefined = undefined

function uint32Buf(num: number) {
	const buffer = Buffer.alloc(4)
	buffer.writeUint32LE(num)
	return buffer
}

function uint16Buf(num: number) {
	const buffer = Buffer.alloc(2)
	buffer.writeUint16LE(num)
	return buffer
}

const logger = usePluginLogger("wyoming")

class WyomingTTSVoiceProvider extends TTSVoiceProvider {
	constructor(private voice: WyomingTTSVoice) {
		super()

		this._id = `wyoming.${voice.name}`

		this._config = {
			name: `Wyoming ${voice.name}`,
			provider: "wyoming",
			providerId: voice.name,
		}
	}

	async generate(text: string, voiceConfig: any, filename: string): Promise<void> {
		if (!socket) return

		const pcmData = await synthesizeWyomingTTS(
			socket,
			{
				name: this.config.providerId,
				speaker: voiceConfig.speaker,
			},
			text
		)

		const writer = createWriteStream(filename)

		const sampleRate = pcmData.rate
		const bytesPerSample = pcmData.width
		const bytesPerSecond = bytesPerSample * sampleRate

		writer.write("RIFF")
		writer.write(uint32Buf(44 + pcmData.pcm.byteLength))
		writer.write("WAVE")
		writer.write("fmt ")
		writer.write(uint32Buf(16)) //Chunk Size
		writer.write(uint16Buf(1)) //Data is formated as PCM
		writer.write(uint16Buf(pcmData.channels))
		writer.write(uint32Buf(sampleRate))
		writer.write(uint32Buf(bytesPerSecond))
		writer.write(uint16Buf(bytesPerSample))
		writer.write(uint16Buf(bytesPerSample * 8))

		writer.write("data")

		writer.write(uint32Buf(pcmData.pcm.byteLength))
		writer.write(pcmData.pcm)

		writer.close()
	}

	getVoiceConfigSchema() {
		if (!this.voice.speakers) return undefined

		logger.log("Got Schema!")

		return declareSchema({
			type: Object,
			properties: {
				speaker: { type: String, name: "Speaker", enum: this.voice.speakers.map((s) => s.name) },
			},
		})
	}
}

export default definePlugin(
	{
		id: "wyoming",
		name: "Wyoming Protocol",
		description: "Connects to the Wyoming Protocol Docker Container",
		icon: "mdi-pencil",
	},
	() => {
		const wyomingHost = defineSetting("wyomingHost", {
			type: String,
			name: "Wyoming Server Hostname",
		})

		const wyomingPort = defineSetting("wyomingPort", {
			type: Number,
			name: "Wyoming Server Port",
			default: 10200,
		})

		async function connectToWyoming() {
			try {
				if (socket) {
					await closeWyomingConnection(socket)
				}
			} finally {
				socket = undefined
			}

			if (!wyomingHost.value) return
			if (!wyomingPort.value) return

			socket = await connectToWyomingServer(wyomingHost.value, wyomingPort.value)

			const info = await getWyomingDescription(socket)

			for (const tts of info.tts) {
				for (const voice of tts.voices) {
					const voiceProvider = new WyomingTTSVoiceProvider(voice)
					if (voice.speakers) {
						logger.log("Creating Voice for", voice)
					}
					await TTSVoiceProvider.storage.inject(voiceProvider)
				}
			}
		}

		//Plugin Intiialization
		onLoad(async () => {
			await connectToWyoming()
		})
	}
)
