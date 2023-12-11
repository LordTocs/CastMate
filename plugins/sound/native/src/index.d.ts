import * as Events from "events"

declare namespace CastmatePluginSoundNative {
	interface AudioDeviceInterfaceEvents {
		"device-added": (device: AudioDevice) => void | Promise<void>
		"device-removed": (deviceId: string) => void | Promise<void>
		"device-changed": (device: AudioDevice) => void | Promise<void>
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
