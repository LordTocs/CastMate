import { KeyCombo, KeyboardKey } from "castmate-plugin-input-shared"
import { defineAction, defineTrigger, onLoad } from "castmate-core"
import { Duration } from "castmate-schema"

import { globalShortcut } from "electron"

export function setupKeyboard() {
	onLoad(() => {})

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
				key: { type: KeyboardKey, name: "Key", required: true },
				duration: { type: Duration, name: "Press Time", required: true, default: 0.1, template: true },
			},
		},
		async invoke(config, contextData, abortSignal) {},
	})

	defineTrigger({
		id: "keyboardShortcut",
		name: "Keyboard Shortcut",
		icon: "mdi mdi-keyboard",
		context: {
			type: Object,
			properties: {
				combo: { type: KeyCombo, name: "Combo", required: true },
			},
		},
		config: {
			type: Object,
			properties: {
				combo: { type: KeyCombo, name: "Combo", required: true },
			},
		},
		async handle(config, context) {
			return KeyCombo.equals(config.combo, context.combo)
		},
	})
}
