import * as Events from "events"

declare namespace CastmatePluginSoundNative {
	interface AudioDeviceInterfaceEvents {
		"device-added": (device: AudioDevice) => void | Promise<void>
		"device-removed": (deviceId: string) => void | Promise<void>
		"device-changed": (device: AudioDevice) => void | Promise<void>
		"default-input-changed": (type: "main" | "chat", device: AudioDevice) => void | Promise<void>
		"default-output-changed": (type: "main" | "chat", device: AudioDevice) => void | Promise<void>
	}

	interface AudioDevice {
		id: string
		type: "input" | "output"
		state: "active" | "disabled" | "not_present" | "unplugged" | "unknown"
		name: string
		guid: string
	}

	class AudioDeviceInterface extends Events.EventEmitter {
		getDevices(): AudioDevice[]
		getDefaultOutput(type: "main" | "chat"): AudioDevice | undefined
		getDefaultInput(type: "main" | "chat"): AudioDevice | undefined

		on<U extends keyof AudioDeviceInterfaceEvents>(event: U, listener: AudioDeviceInterfaceEvents[U]): this

		once<U extends keyof AudioDeviceInterfaceEvents>(event: U, listener: AudioDeviceInterfaceEvents[U]): this

		off<U extends keyof AudioDeviceInterfaceEvents>(event: U, listener: AudioDeviceInterfaceEvents[U]): this

		emit<U extends keyof AudioDeviceInterfaceEvents>(
			event: U,
			...args: Parameters<AudioDeviceInterfaceEvents[U]>
		): boolean
	}
}

export = CastmatePluginSoundNative
