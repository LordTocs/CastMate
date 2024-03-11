import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	defineSetting,
	usePluginLogger,
} from "castmate-core"
import { VoiceModClient } from "./client"

export default definePlugin(
	{
		id: "voicemod",
		name: "Voicemod",
		description: "Control VoiceMod with CastMate",
		icon: "mdi mdi-star",
		color: "#3F918D",
	},
	() => {
		const logger = usePluginLogger()
		let voiceMod: VoiceModClient = new VoiceModClient()

		const voiceModHost = defineSetting("host", {
			type: String,
			name: "VoiceMod Hostname",
			default: "127.0.0.1",
			required: true,
		})

		async function tryConnect() {
			try {
				await voiceMod.connect(voiceModHost.value)
			} catch (err) {}
		}

		function retryConnection() {
			setTimeout(async () => {
				await tryConnect()
			}, 30 * 1000)
		}

		onLoad((plugin) => {
			voiceMod.onClose = () => retryConnection()
			tryConnect()
		})

		defineAction({
			id: "selectVoice",
			name: "Change Voice",
			icon: "mdi mdi-account-voice",
			config: {
				type: Object,
				properties: {
					voice: {
						type: String,
						name: "Voice",
						required: true,
						default: "nofx",
						async enum() {
							//logger.log("Voice Enum Fetch")
							const voices = await voiceMod.getVoices()

							const enumVoices = voices.filter((v) => v.isEnabled)

							//logger.log(enumVoices)

							return enumVoices.map((v) => ({
								value: v.id,
								name: v.friendlyName,
							}))
						},
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				await voiceMod.selectVoice(config.voice)
			},
		})
	}
)
