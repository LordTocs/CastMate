import * as Events from "events"

declare namespace CastmatePluginInputNative {
	type MouseButton = "left" | "right" | "middle" | "mouse4" | "mouse5"

	interface InputInterfaceEvents {
		"key-pressed": (vkCode: number) => void | Promise<void>
		"key-released": (vkCode: number) => void | Promise<void>
	}

	class InputInterface extends Events.EventEmitter {
		simulateKeyDown(vkCode: number): void
		simulateKeyUp(vkCode: number): void
		simulateMouseDown(button: MouseButton): void
		simulateMouseUp(button: MouseButton): void

		isKeyDown(key: number): boolean

		startEvents(): void
		stopEvents(): void

		on<U extends keyof InputInterfaceEvents>(event: U, listener: InputInterfaceEvents[U]): this

		once<U extends keyof InputInterfaceEvents>(event: U, listener: InputInterfaceEvents[U]): this

		off<U extends keyof InputInterfaceEvents>(event: U, listener: InputInterfaceEvents[U]): this

		emit<U extends keyof InputInterfaceEvents>(event: U, ...args: Parameters<InputInterfaceEvents[U]>): boolean
	}
}

export = CastmatePluginInputNative
