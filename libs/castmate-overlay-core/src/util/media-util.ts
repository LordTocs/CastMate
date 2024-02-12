import { ComputedRef, MaybeRefOrGetter, computed, inject, toValue } from "vue"
import { useIsEditor } from "./editor-util"
import path from "path"

export function useMediaFolder(): ComputedRef<string> {
	return inject<ComputedRef<string>>(
		"mediaFolder",
		computed(() => "ERROR")
	)
}

function resolveMediaUrl(mediaFile: string, isEditor: boolean, mediaFolder: string) {
	if (isEditor) {
		return path.resolve(mediaFolder, mediaFile)
	} else {
		return `http://${window.location.host}/media/${mediaFile}`
	}
}

export function useMediaUrl(mediaFile: MaybeRefOrGetter<string | undefined>) {
	const mediaFolder = useMediaFolder()
	const isEditor = useIsEditor()

	return computed(() => {
		const file = toValue(mediaFile)

		if (file == null) return undefined

		return resolveMediaUrl(file, isEditor, mediaFolder.value)
	})
}

export function useSoundPlayer() {
	const isEditor = useIsEditor()
	const mediaFolder = useMediaFolder()

	return {
		playSound(mediaFile: string) {
			if (!mediaFile) return

			console.log("Playing", mediaFile)
			const url = resolveMediaUrl(mediaFile, isEditor, mediaFolder.value)

			const audio = new Audio(url)

			audio.addEventListener("canplaythrough", (event) => {
				audio.play()
			})
		},
	}
}
