import { KeyCombo, KeyboardKey, Keys } from "castmate-plugin-input-shared"
import { defineAction, defineTrigger, onLoad, onProfilesChanged } from "castmate-core"
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

	const keyboardShortcut = defineTrigger({
		id: "keyboardShortcut",
		name: "Keyboard Shortcut",
		icon: "mdi mdi-keyboard",
		context: {
			type: Object,
			properties: {
				combo: { type: KeyCombo, name: "Combo", required: true, default: ["LeftControl"] },
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

	let activeAccelerators = new Map<string, KeyCombo[]>()

	onProfilesChanged((activeProfiles, inactiveProfiles) => {
		const accelerators = new Map<string, KeyCombo[]>()

		for (const profile of activeProfiles) {
			for (const trigger of profile.config.triggers) {
				if (trigger.plugin == "input" && trigger.trigger == "keyboardShortcut") {
					let accelerator = ""
					for (const key of trigger.config.combo as KeyCombo) {
						//Assuming they're sorted properly
						if (accelerator.length > 0) {
							accelerator += "+"
						}
						accelerator += Keys[key].electronAccelerator
					}

					if (accelerator.length > 0) {
						//accelerators.add(accelerator)
						const existing = accelerators.get(accelerator)
						if (existing) {
							existing.push(trigger.config.combo as KeyCombo)
						} else {
							accelerators.set(accelerator, [trigger.config.combo as KeyCombo])
						}
					}
				}
			}
		}

		const newAccelerators = new Set(accelerators.keys())
		for (const oldAccelerator of activeAccelerators.keys()) {
			newAccelerators.delete(oldAccelerator)
		}

		const disableAccelerators = new Set(activeAccelerators.keys())
		for (const newAccelerator of accelerators.keys()) {
			disableAccelerators.delete(newAccelerator)
		}

		activeAccelerators = accelerators

		for (const newAccelerator of newAccelerators) {
			console.log("Registering Shortcut", newAccelerator)
			const registered = globalShortcut.register(newAccelerator, () => {
				const combos = activeAccelerators.get(newAccelerator)
				if (!combos) return
				for (const combo of combos) {
					keyboardShortcut({
						combo,
					})
				}
			})
			if (!registered) {
				console.error("Failed to register shortcut", newAccelerator)
			}
		}

		for (const disable of disableAccelerators) {
			globalShortcut.unregister(disable)
		}
	})
}
