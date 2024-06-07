import { ComputedRef, MaybeRefOrGetter, computed, inject, provide, toValue } from "vue"
import { useIsEditor } from "./editor-util"
import path from "path"

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
