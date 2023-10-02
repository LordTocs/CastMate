import { defineAction, defineTrigger } from "castmate-core"
import { Duration } from "castmate-schema"

export function setupKeyboard() {
	defineAction({
		id: "pressKey",
		name: "Simulate Keyboard",
		icon: "mdi mdi-keyboard",
		duration: {
			dragType: "length",
			rightSlider: {
				sliderProp: "duration",
			},
		},
		config: {
			type: Object,
			properties: {
				key: { type: String, name: "Key", required: true },
				duration: { type: Duration, name: "Press Time", required: true, default: 0.1, template: true },
			},
		},
		async invoke(config, contextData, abortSignal) {},
	})
}
