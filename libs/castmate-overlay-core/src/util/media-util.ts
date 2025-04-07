import { ComputedRef, MaybeRefOrGetter, computed, inject, markRaw, provide, ref, toValue } from "vue"
import { useIsEditor } from "./editor-util"
import path from "path"
import { defineStore } from "pinia"

export interface EditorMediaResolver {
	resolveMedia(file: string): string
}

export function useEditorMediaResolver(): ComputedRef<EditorMediaResolver> {
	return inject<ComputedRef<EditorMediaResolver>>(
		"mediaResolver",
		computed(() => ({
			resolveMedia(file) {
				throw new Error("No Media Resolver Mounted")
			},
		}))
	)
}

export function provideEditorMediaResolver(resolver: MaybeRefOrGetter<EditorMediaResolver>) {
	provide(
		"mediaResolver",
		computed(() => toValue(resolver))
	)
}

function resolveMediaUrl(mediaFile: string, isEditor: boolean, resolver: EditorMediaResolver) {
	if (isEditor) {
		return resolver.resolveMedia(mediaFile)
	} else {
		return `http://${window.location.host}/media/${mediaFile}`
	}
}

export function useMediaUrl(mediaFile: MaybeRefOrGetter<string | undefined>) {
	const mediaResolver = useEditorMediaResolver()
	const isEditor = useIsEditor()

	return computed(() => {
		const file = toValue(mediaFile)

		if (file == null) return undefined

		return resolveMediaUrl(file, isEditor, mediaResolver.value)
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
	const isEditor = useIsEditor()
	const mediaResolver = useEditorMediaResolver()

	return {
		playSound(mediaFile: string) {
			if (!mediaFile) return

			console.log("Playing", mediaFile)
			const url = resolveMediaUrl(mediaFile, isEditor, mediaResolver.value)

			const audio = new Audio(url)

			audio.addEventListener("canplaythrough", (event) => {
				audio.play()
			})
		},
	}
}
