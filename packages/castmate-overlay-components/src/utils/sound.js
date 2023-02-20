import { inject } from "vue"

export function useSoundPlayer() {
	const isEditor = inject("isEditor")
	const mediaFolder = inject("mediaFolder")

	return {
		playSound(mediaFile) {
			console.log("Playing", mediaFile)
			if (!mediaFile) return

			let fullFile = null
			if (isEditor) {
				fullFile = `${path.resolve(mediaFolder.value, mediaFile)}`
			} else {
				fullFile = `http://${window.location.host}/media/${mediaFile}`
			}

			let audio = new Audio(fullFile)
			audio.addEventListener("canplaythrough", (event) => {
				audio.play()
			})
		},
	}
}
