import { abortableSleep, defineAction } from "castmate-core"
import { InputInterface, MouseButton } from "castmate-plugin-input-native"
import { Duration } from "castmate-schema"

export function setupMouse(inputInterface: InputInterface) {
	defineAction({
		id: "mouseButton",
		name: "Simulate Mouse",
		icon: "mdi mdi-mouse",
		config: {
			type: Object,
			properties: {
				button: {
					type: String,
					name: "Button",
					default: "left",
					enum: ["left", "right", "middle", "mouse4", "mouse5"],
				},
				duration: { type: Duration, name: "Duration", required: true, default: 0.1 },
			},
		},
		async invoke(config, contextData, abortSignal) {
			inputInterface.simulateMouseDown(config.button as MouseButton)

			await abortableSleep(config.duration * 1000, abortSignal)

			inputInterface.simulateMouseUp(config.button as MouseButton)
		},
	})
}
