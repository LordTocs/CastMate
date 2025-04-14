import { AudioRedirect, AudioRedirectorConfig } from "castmate-plugin-sound-shared"
import { SoundOutput } from "./output"
import { nanoid } from "nanoid/non-secure"
import {
	createResource,
	defineIPCFunc,
	loadFileResources,
	onLoad,
	resolveProjectPath,
	usePluginLogger,
	writeYAML,
} from "castmate-core"
import fs from "fs/promises"

const logger = usePluginLogger("sound")

export class AudioRedirectorOutput extends SoundOutput<AudioRedirectorConfig> {
	static resourceDirectory = "./sound/redirectors"

	constructor(name?: string) {
		super()

		if (name) {
			this._id = nanoid()
		}

		this._config = {
			name: name ?? "",
			type: "redirector",
			redirects: [],
		}
	}

	get filename() {
		return `${this.id}.yaml`
	}

	get filepath() {
		return resolveProjectPath(AudioRedirectorOutput.resourceDirectory, this.filename)
	}

	async load(savedConfig: object): Promise<boolean> {
		await super.applyConfig(savedConfig) //Intentially call super here to avoid triggering a save
		return true
	}

	/**
	 * Used to limit what part of the config is saved to file
	 */
	get savedConfig(): object {
		return this.config
	}

	async save() {
		await writeYAML(this.savedConfig, this.filepath)
	}

	static async onCreate(resource: AudioRedirectorOutput) {
		await resource.save()
	}

	static async onDelete(resource: AudioRedirectorOutput) {
		await fs.unlink(resource.filepath)
	}

	async applyConfig(config: AudioRedirectorConfig): Promise<boolean> {
		await super.applyConfig(config)
		await this.save()
		return true
	}

	async setConfig(config: AudioRedirectorConfig): Promise<boolean> {
		await super.setConfig(config)
		await this.save()
		return true
	}

	async playFile(
		file: string,
		startSec: number,
		endSec: number,
		volume: number,
		abortSignal: AbortSignal
	): Promise<boolean> {
		interface RedirectedOutput {
			output: SoundOutput
			volume: number
		}

		//Manually unwrap any redirected sound outputs, to stop loops and resolve multiple refs.

		const outputs = new Map<SoundOutput, RedirectedOutput>()
		const processedRedirectors = new Set<AudioRedirectorOutput>()

		const outputStack = new Array<RedirectedOutput | undefined>()
		outputStack.push({ output: this, volume })

		while (outputStack.length > 0) {
			const top = outputStack.pop()

			if (!top) continue
			if (top.volume <= 0) continue

			const topOutput = top.output

			if ("type" in topOutput.config && topOutput.config.type == "redirector") {
				const topRedirector = topOutput as AudioRedirectorOutput

				if (processedRedirectors.has(topRedirector)) {
					continue
				}
				processedRedirectors.add(topRedirector)

				outputStack.push(
					...topRedirector.config.redirects.map((r) => {
						if (!r.output) return undefined
						if (r.mute) return undefined
						const actualOutput = SoundOutput.storage.getById(r.output)
						if (!actualOutput) return undefined

						return {
							output: actualOutput,
							volume: (top.volume / 100) * r.volume,
						}
					})
				)
			} else {
				const existing = outputs.get(topOutput)
				if (existing) {
					//If an output is referenced twice, choose the louder of the two.
					//This kind of breaks with deeper refs. TODO: Figure that out
					if (top.volume > existing.volume) {
						existing.volume = top.volume
					}
				} else {
					outputs.set(topOutput, { output: topOutput, volume: top.volume })
				}
			}
		}

		const plays = [...outputs.values()].map((o) => {
			if (o.volume == 0) return true
			return o.output?.playFile(file, startSec, endSec, o.volume, abortSignal)
		})

		const playResults = await Promise.allSettled(plays)

		for (const result of playResults) {
			if (result.status == "fulfilled" && result.value) return true
		}

		return false
	}
}

export function setupRedirects() {
	defineIPCFunc("sound", "createRedirector", async (name: string) => {
		const result = await createResource(AudioRedirectorOutput, name)
		return result.id
	})

	onLoad(() => {
		logger.log("------ REDIRECTOR", AudioRedirectorOutput)
		loadFileResources(AudioRedirectorOutput)
	})
}
