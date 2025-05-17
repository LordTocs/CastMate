import {
	onLoad,
	FileResource,
	ResourceStorageBase,
	ResourceStorage,
	usePluginLogger,
	definePluginResource,
	defineIPCFunc,
} from "castmate-core"
import { JZZPortInfo, MidiPortConfig, MidiPortState } from "castmate-plugin-midi-shared"
import jzz from "jzz"
import { nanoid } from "nanoid/non-secure"

const logger = usePluginLogger("midi")

//Make up for jzz's types being... less than good
type JZZEngine = Awaited<ReturnType<typeof jzz>>
type JZZMidi = InstanceType<typeof jzz.MIDI>
type JZZPort = Awaited<ReturnType<JZZEngine["openMidiIn"]>>

interface JZZPortChange {
	added?: Array<JZZPortInfo>
	removed?: Array<JZZPortInfo>
}

interface JZZEngineChange {
	inputs?: JZZPortChange
	outputs?: JZZPortChange
}

interface JZZEngineInfo {
	name: string
	version: string
	engine: string
	sysex?: boolean
	inputs: JZZPortInfo[]
	outputs: JZZPortInfo[]
}

let midiEngine: JZZEngine | undefined = undefined

function portMatchesConfig(portInfo: JZZPortInfo, config: MidiPortConfig) {
	return config.midiDeviceName == portInfo.name
}

export class MidiInputResource extends FileResource<MidiPortConfig, MidiPortState> {
	static resourceDirectory = "./midi/inputs"
	static storage = new ResourceStorage<MidiInputResource>("MidiInput")

	private port: JZZPort | undefined = undefined

	constructor(name?: string) {
		super()

		if (name) {
			this._id = nanoid()
		}

		this._config = {
			name: name ?? "",
			midiDeviceName: "",
			shouldConnect: true,
		}

		this.state = { connected: false }
	}

	async setConfig(config: MidiPortConfig): Promise<boolean> {
		const beforeDevice = this.config.midiDeviceName
		const beforeConnect = this.config.shouldConnect
		const result = await super.setConfig(config)
		if (!result) return false

		if (beforeDevice != this.config.midiDeviceName || beforeConnect != this.config.shouldConnect) {
			await this.openPort()
		}
		return true
	}

	async applyConfig(config: MidiPortConfig): Promise<boolean> {
		const beforeDevice = this.config.midiDeviceName
		const beforeConnect = this.config.shouldConnect
		const result = await super.applyConfig(config)
		if (!result) return false

		if (beforeDevice != this.config.midiDeviceName || beforeConnect != this.config.shouldConnect) {
			await this.openPort()
		}
		return true
	}

	async closePort() {
		try {
			await this.port?.close()
			this.port = undefined
		} catch (err) {
			logger.error("ERROR w/ ", this.config.name, err)
		}
	}

	async openPort() {
		if (this.port) {
			logger.log("Closing Midi Input", this.port.name())
			await this.closePort()
		}

		if (!this.config.shouldConnect) return

		try {
			this.port = await midiEngine?.openMidiIn(this.config.midiDeviceName)
			logger.log("Opened Midi Input", this.config.midiDeviceName, "for", this.config.name)

			this.port?.connect(async (msg: JZZMidi) => {
				logger.log("   Recieved Midi Message", msg.toString(), " on ", this.config.name)
			})

			return true
		} catch (err) {
			logger.error("ERROR w/", this.config.name, err)
			this.port = undefined
			this.state.connected = false
		}
		return false
	}

	async handlePortAdded(info: JZZPortInfo) {
		if (portMatchesConfig(info, this.config)) {
			await this.openPort()
		}
	}

	async handlePortRemoved(info: JZZPortInfo) {
		if (portMatchesConfig(info, this.config)) {
			await this.closePort()
		}
	}
}

export class MidiOutputResource extends FileResource<MidiPortConfig, MidiPortState> {
	static resourceDirectory = "./midi/outputs"
	static storage = new ResourceStorage<MidiOutputResource>("MidiOutput")

	private port: JZZPort | undefined = undefined

	constructor(name?: string) {
		super()

		if (name) {
			this._id = nanoid()
		}

		this._config = {
			name: name ?? "",
			midiDeviceName: "",
			shouldConnect: true,
		}

		this.state = { connected: false }
	}

	async closePort() {
		try {
			await this.port?.close()
			this.port = undefined
			this.state.connected = false
		} catch (err) {
			logger.error("ERROR w/ ", this.config.name, err)
		}
	}

	async openPort() {
		if (this.port) {
			logger.log("Closing Midi Output", this.port.name())
			await this.closePort()
		}

		if (!this.config.shouldConnect) return

		try {
			this.port = await midiEngine?.openMidiOut(this.config.midiDeviceName)
			logger.log("Opened Midi Output", this.config.midiDeviceName, "for", this.config.name)
			return true
		} catch (err) {
			logger.error("ERROR w/", this.config.name, err)
			this.port = undefined
			this.state.connected = false
		}
		return false
	}

	async handlePortAdded(info: JZZPortInfo) {
		if (portMatchesConfig(info, this.config)) {
			await this.openPort()
		}
	}

	async handlePortRemoved(info: JZZPortInfo) {
		if (portMatchesConfig(info, this.config)) {
			await this.closePort()
		}
	}
}

export function setupMidiResources() {
	definePluginResource(MidiInputResource)
	definePluginResource(MidiOutputResource)

	defineIPCFunc("midi", "getInputs", async () => {
		const info = midiEngine?.info() as JZZEngineInfo | undefined
		if (!info) {
			return []
		}

		return info.inputs
	})

	defineIPCFunc("midi", "getOutputs", async () => {
		const info = midiEngine?.info() as JZZEngineInfo | undefined
		if (!info) {
			return []
		}

		return info.outputs
	})

	onLoad(async () => {
		await jzz.requestMIDIAccess()

		midiEngine = await jzz()

		const engineInfo = midiEngine.info() as JZZEngineInfo

		for (const info of engineInfo.inputs) {
			for (const resource of MidiInputResource.storage) {
				await resource.handlePortAdded(info)
			}
		}

		for (const info of engineInfo.outputs) {
			for (const resource of MidiOutputResource.storage) {
				await resource.handlePortAdded(info)
			}
		}

		midiEngine.onChange(async (change: JZZEngineChange) => {
			if (change.inputs) {
				if (change.inputs.added) {
					for (const info of change.inputs.added) {
						for (const resource of MidiInputResource.storage) {
							await resource.handlePortAdded(info)
						}
					}
				}

				if (change.inputs.removed) {
					for (const info of change.inputs.removed) {
						for (const resource of MidiInputResource.storage) {
							await resource.handlePortRemoved(info)
						}
					}
				}
			}

			if (change.outputs) {
				if (change.outputs.added) {
					for (const info of change.outputs.added) {
						for (const resource of MidiOutputResource.storage) {
							await resource.handlePortAdded(info)
						}
					}
				}

				if (change.outputs.removed) {
					for (const info of change.outputs.removed) {
						for (const resource of MidiOutputResource.storage) {
							await resource.handlePortRemoved(info)
						}
					}
				}
			}
		})
	})
}
