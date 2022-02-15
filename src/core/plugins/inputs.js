const { mouse, keyboard, Key, Button } = require("@nut-tree/nut-js");
const { sleep } = require('../utils/sleep.js');

const keys = Object.keys(Key).filter(v => isNaN(parseInt(v)))
const buttons = Object.keys(Button).filter(v => isNaN(parseInt(v)));

module.exports = {
	name: "inputs",
	uiName: "Input Simulation",
	icon: "mdi-keyboard",
	color: "#826262",
	async init() {
	},
	methods: {
	},
	settings: {
	},
	secrets: {
	},
	state: {
	},
	actions: {
		pressKey: {
			name: "Press Key",
			description: "Presses a selected keyboard key.",
			icon: "mdi-keyboard",
			color: "#826262",
			data: {
				type: Object,
				properties: {
					key: {
						type: String,
						name: "Key",
						enum() {
							return keys
						}
					},
					time: {
						type: Number,
						name: "Press Time",
						default: 0.1
					}
				}
			},
			async handler(keyData) {
				//robot.keyToggle(keyData.key, 'down');
				await keyboard.pressKey(Key[keyData.key])

				let pressLength = keyData.time || 0.1;

				await sleep(pressLength * 1000);

				await keyboard.releaseKey(Key[keyData.key])
			}
		},
		mouseButton: {
			name: "Mouse Button",
			description: "Presses a mouse button",
			icon: "mdi-mouse",
			color: "#826262",
			data: {
				type: Object,
				properties: {
					button: {
						type: String,
						name: "Mouse Button",
						enum() {
							return buttons;
						}
					},
					time: {
						type: Number,
						name: "Press Time",
						default: 0.1
					}
				}
			},
			async handler(mouseData) {
				await mouse.pressButton(Button[mouseData.button])

				let pressLength = mouseData.time || 0.1;

				await sleep(pressLength * 1000);

				await mouse.releaseButton(Button[mouseData.button])
			}
		}
	}
}