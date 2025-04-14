import { SoundOutputConfig, WebAudioDeviceInfo } from "castmate-plugin-sound-shared"
import {
	Resource,
	ResourceStorage,
	PluginManager,
	definePluginResource,
	onUILoad,
	onLoad,
	SatelliteResourceSymbol,
	SatelliteResources,
	defineSatelliteResourceSlotHandler,
	SatelliteMedia,
} from "castmate-core"
import { AudioDevice, AudioDeviceInterface } from "castmate-plugin-sound-native"
import { defineCallableIPC, defineIPCRPC } from "castmate-core/src/util/electron"
import { RendererSoundPlayer } from "./renderer-sound-player"
import { nanoid } from "nanoid/non-secure"

export class SoundOutput<
	ExtendedSoundConfig extends SoundOutputConfig = SoundOutputConfig
> extends Resource<ExtendedSoundConfig> {
	static storage = new ResourceStorage<SoundOutput>("SoundOutput")

	async playFile(file: string, startSec: number, endSec: number, volume: number, abortSignal: AbortSignal) {
		console.error("Don't enter here!")
		return false
	}
}

interface SystemSoundOutputConfig extends SoundOutputConfig {
	type: "system"
	deviceId: string
	webId?: string
	isDefault: boolean
}

export class SystemSoundOutput extends SoundOutput<SystemSoundOutputConfig> {
	constructor(mediaDevice: AudioDevice | "chat" | "main", defaultDevice?: AudioDevice) {
		super()
		if (typeof mediaDevice == "string") {
			if (!defaultDevice) throw new Error("Default Requires AudioDevice")

			const id = mediaDevice == "main" ? "default" : "communications"
			this._id = `system.${id}`
			this._config = {
				type: "system",
				isDefault: true,
				deviceId: id,
				name:
					mediaDevice == "main"
						? `Default - ${defaultDevice.name}`
						: `Communications - ${defaultDevice.name}`,
				webId: id,
			}
		} else {
			this._id = `system.${mediaDevice.id}`
			this._config = {
				type: "system",
				isDefault: false,
				deviceId: mediaDevice.id,
				name: mediaDevice.name,
			}

			this.queryWebId()
		}
	}

	async queryWebId() {
		if (!PluginManager.getInstance().isUILoaded) return
		if (this.config.isDefault) return

		try {
			const webId = await getOutputWebId(this.config.name)
			//console.log("Got WebId", this.config.name, webId)
			await this.applyConfig({
				webId: webId,
			})
		} catch (err) {}
	}

	async setDefault(device: AudioDevice) {
		if (device.state != "active" || device.type != "output") throw new Error("Default Device Invalid")

		await this.applyConfig({
			name: this.id == "system.default" ? `Default - ${device.name}` : `Communications - ${device.name}`,
		})
	}

	async playFile(
		file: string,
		startSec: number,
		endSec: number,
		volume: number,
		abortSignal: AbortSignal
	): Promise<boolean> {
		if (!this.config.webId) return false
		await RendererSoundPlayer.getInstance().playSound(
			file,
			startSec,
			endSec,
			volume,
			this.config.webId,
			abortSignal
		)
		return true
	}
}

const getOutputWebId = defineIPCRPC<(name: string) => string | undefined>("sound", "getOutputWebId")

export class SatelliteSoundOutput extends SoundOutput {
	static [SatelliteResourceSymbol] = true

	constructor() {
		super()
		this._config = {
			name: "",
		}
		this.state = {}
	}

	async playFile(
		file: string,
		startSec: number,
		endSec: number,
		volume: number,
		abortSignal: AbortSignal
	): Promise<boolean> {
		const playId = nanoid()

		abortSignal.onabort = () => SatelliteResources.getInstance().callResourceRPC(this.id, "abortPlay", playId)
		await SatelliteResources.getInstance().callResourceRPC(
			this.id,
			"playFile",
			playId,
			file,
			startSec,
			endSec,
			volume
		)

		return true
	}
}

export function setupOutput() {
	definePluginResource(SoundOutput)

	const satelliteAbortMap = new Map<string, AbortController>()

	defineSatelliteResourceSlotHandler(SoundOutput, {
		satelliteConstructor: SatelliteSoundOutput,
		rpcs: {
			playFile: async (
				resource,
				playId: string,
				file: string,
				startSec: number,
				endSec: number,
				volume: number
			) => {
				try {
					const mediaFile = await SatelliteMedia.getInstance().getMediaFile(file)

					const abortController = new AbortController()

					satelliteAbortMap.set(playId, abortController)

					await resource.playFile(
						mediaFile,
						startSec ?? 0,
						endSec ?? Number.POSITIVE_INFINITY,
						volume,
						abortController.signal
					)
				} catch (err) {
				} finally {
					satelliteAbortMap.delete(playId)
				}
			},
			abortPlay: async (resource, playId: string) => {
				const aborter = satelliteAbortMap.get(playId)
				aborter?.abort()
			},
		},
	})

	let audioDeviceInterface: AudioDeviceInterface

	onUILoad(async () => {
		for (const output of SoundOutput.storage) {
			if (!output.id.startsWith("system")) continue
			const systemOutput = output as SystemSoundOutput
			systemOutput.queryWebId()
		}
	})

	onLoad(async () => {
		audioDeviceInterface = new AudioDeviceInterface()

		const nativeDevices = audioDeviceInterface.getDevices()

		const mainOutput = audioDeviceInterface.getDefaultOutput("main")
		const commOutput = audioDeviceInterface.getDefaultOutput("chat")

		const defaultOutput = new SystemSoundOutput("main", mainOutput)
		const defaultComm = new SystemSoundOutput("chat", commOutput)
		await SoundOutput.storage.inject(defaultOutput)
		await SoundOutput.storage.inject(defaultComm)

		for (const device of nativeDevices) {
			if (device.state != "active" || device.type != "output") continue

			const output = new SystemSoundOutput(device)
			await SoundOutput.storage.inject(output)
		}

		audioDeviceInterface.on("device-added", async (device) => {
			if (device.state == "active" && device.type == "output") {
				const new_device = new SystemSoundOutput(device)
				await SoundOutput.storage.inject(new_device)
			}
		})

		audioDeviceInterface.on("device-removed", async (deviceId) => {
			await SoundOutput.storage.remove(`system.${deviceId}`)
		})

		audioDeviceInterface.on("device-changed", async (device) => {
			const existing = SoundOutput.storage.getById(`system.${device.id}`)

			if (!existing) {
				if (device.state == "active" && device.type == "output") {
					const new_device = new SystemSoundOutput(device)
					await SoundOutput.storage.inject(new_device)
				}
			} else {
				if (device.state != "active") {
					await SoundOutput.storage.remove(existing.id)
				} else {
					await existing.applyConfig({
						name: device.name,
					})
				}
			}
		})

		audioDeviceInterface.on("default-output-changed", async (type, device) => {
			if (type == "main") {
				const existing = SoundOutput.storage.getById("system.default")
				if (!existing) return
				const systemOut = existing as SystemSoundOutput
				systemOut.setDefault(device)
			} else if (type == "chat") {
				const existing = SoundOutput.storage.getById("system.communications")
				if (!existing) return
				const systemOut = existing as SystemSoundOutput
				systemOut.setDefault(device)
			}
		})

		RendererSoundPlayer.initialize()
	})
}
