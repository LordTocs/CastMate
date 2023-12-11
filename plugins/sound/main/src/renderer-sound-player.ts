import { Service } from "castmate-core"
import { defineCallableIPC, defineIPCFunc } from "castmate-core/src/util/electron"
import { nanoid } from "nanoid/non-secure"

const playSoundInRenderer = defineCallableIPC<
	(id: string, file: string, startSec: number, endSec: number, volume: number, sinkId: string) => void
>("sound", "playSoundInRenderer")

const abortSoundInRenderer = defineCallableIPC<(id: string) => string>("sound", "abortSoundInRenderer")

interface PlayingSound {
	resolve(): void
}

export const RendererSoundPlayer = Service(
	class {
		private playingSounds = new Map<string, PlayingSound>()

		constructor() {
			defineIPCFunc("sound", "soundFinishedInRenderer", (id: string) => {
				console.log("Sound Complete", id)
				this.resolveSound(id)
			})
		}

		private resolveSound(id: string) {
			const playing = this.playingSounds.get(id)
			playing?.resolve()
			this.playingSounds.delete(id)
		}

		//TODO: Will this get stuck if you manage to close the window during a sound playing?

		playSound(file: string, startSec: number, endSec: number, volume: number, sinkId: string, abort: AbortSignal) {
			return new Promise((resolve, reject) => {
				const id = nanoid()

				this.playingSounds.set(id, {
					resolve: () => resolve(undefined),
				})

				playSoundInRenderer(id, file, startSec, endSec, volume, sinkId)

				abort.addEventListener(
					"abort",
					() => {
						abortSoundInRenderer(id)
						this.resolveSound(id)
					},
					{ once: true }
				)
			})
		}
	}
)
