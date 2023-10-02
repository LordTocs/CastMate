import { defineAction, defineTrigger, onLoad, onUnload, definePlugin, defineSetting } from "castmate-core"
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
		let voiceMod: VoiceModClient = new VoiceModClient()

		const voiceModHost = defineSetting("host", {
			type: String,
			name: "VoiceMod Hostname",
			default: "127.0.0.1",
			required: true,
		})

		async function tryConnect() {
			try {
				voiceMod.connect(voiceModHost.value)
			} catch {}
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
			config: {
				type: Object,
				properties: {
					voice: { type: String, name: "Voice", required: true, default: "nofx" },
				},
			},
			async invoke(config, contextData, abortSignal) {
				await voiceMod.selectVoice(config.voice)
			},
		})
	}
)
