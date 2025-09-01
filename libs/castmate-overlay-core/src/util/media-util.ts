import { MaybeRefOrGetter, computed, inject, markRaw, provide, ref, toValue } from "vue"
import { defineStore } from "pinia"
import { normalizeMediaPath } from "castmate-schema"

export function provideWebMediaResolver() {
	provide("mediaResolver", (mediaFile: string) => {
		return `http://${window.location.host}/media${mediaFile}`
	})
}

export function useMediaResolver() {
	return inject<(mediaFile: string) => string>("mediaResolver", (mediaFile: string) => {
		throw new Error("No Media Resolver Mounted")
	})
}

export function useMediaUrl(mediaFile: MaybeRefOrGetter<string | undefined>) {
	const mediaResolver = useMediaResolver()

	return computed(() => {
		const file = toValue(mediaFile)

		if (file == null) return undefined

		const normFile = normalizeMediaPath(file)

		return mediaResolver(normFile)
	})
}

type ExtendHTMLAudioElement = HTMLAudioElement & { setSinkId(sinkId: string): void }

interface PlayingSound {
	audioElem: ExtendHTMLAudioElement
}

export const useOverlaySoundPlayer = defineStore("overlaySoundPlayer", () => {
	const playingSounds = ref(new Map<string, PlayingSound>())

	function playSound(playId: string, resolvedUrl: string, startSec: number, endSec: number, volume: number) {
		const audioElem: ExtendHTMLAudioElement = new Audio(resolvedUrl) as ExtendHTMLAudioElement
		audioElem.volume = volume / 100
		audioElem.currentTime = startSec

		audioElem.addEventListener(
			"canplaythrough",
			(event) => {
				audioElem.play()
			},
			{ once: true }
		)

		audioElem.addEventListener("timeupdate", () => {
			if (audioElem.currentTime >= endSec) audioElem.pause()
		})

		const finishSound = () => {
			playingSounds.value.delete(playId)
		}

		audioElem.addEventListener("pause", finishSound, { once: true })

		playingSounds.value.set(playId, { audioElem: markRaw(audioElem) })
	}

	function cancelSound(playId: string) {
		const sound = playingSounds.value.get(playId)
		if (sound) {
			sound.audioElem.pause()
			playingSounds.value.delete(playId)
		}
	}

	return {
		playSound,
		cancelSound,
	}
})

export function useSoundPlayer() {
	const mediaResolver = useMediaResolver()

	return {
		playSound(mediaFile: string) {
			if (!mediaFile) return

			console.log("Playing", mediaFile)
			const url = mediaResolver(mediaFile)

			const audio = new Audio(url)

			audio.addEventListener(
				"canplaythrough",
				(event) => {
					audio.play()
				},
				{ once: true }
			)
		},
	}
}
