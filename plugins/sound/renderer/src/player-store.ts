import { handleIpcMessage, ipcInvoke, useIpcCaller } from "castmate-ui-core"
import { defineStore } from "pinia"
import { ref } from "vue"

type ExtendHTMLAudioElement = HTMLAudioElement & { setSinkId(sinkId: string): void }

interface PlayingSound {
	audioElem: ExtendHTMLAudioElement
}

export const useSoundPlayerStore = defineStore("soundPlayer", () => {
	const soundFinishedInRenderer = useIpcCaller<(id: string) => void>("sound", "soundFinishedInRenderer")

	const playingSounds = ref<Record<string, PlayingSound>>({})

	function initialize() {
		handleIpcMessage("sound", "abortSoundInRenderer", (event, id: string) => {
			const playing = playingSounds.value[id]
			if (playing) {
				console.log("Aborting Sound", id)
				playing.audioElem.pause()
				delete playingSounds.value[id]
			}
		})

		handleIpcMessage(
			"sound",
			"playSoundInRenderer",
			(event, id: string, file: string, volume: number, sinkId: string) => {
				const audioElem: ExtendHTMLAudioElement = new Audio(`file://${file}`) as ExtendHTMLAudioElement
				audioElem.volume = volume / 100
				audioElem.setSinkId(sinkId)

				audioElem.addEventListener(
					"canplaythrough",
					(event) => {
						console.log("Starting Sound", id)
						audioElem.play()
					},
					{ once: true }
				)

				audioElem.addEventListener(
					"ended",
					(event) => {
						console.log("Finishing Sound", id)
						soundFinishedInRenderer(id)
						delete playingSounds.value[id]
					},
					{ once: true }
				)

				playingSounds.value[id] = { audioElem }
			}
		)
	}

	return { initialize }
})
