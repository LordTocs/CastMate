const robot = require('robotjs');
const { sleep } = require('../utils/sleep.js');


const keys = [
	"backspace",
	"delete",
	"enter",
	"tab",
	"escape",
	"up",
	"down",
	"right",
	"left",
	"home",
	"end",
	"pageup",
	"pagedown",
	"f1",
	"f2",
	"f3",
	"f4",
	"f5",
	"f6",
	"f7",
	"f8",
	"f9",
	"f10",
	"f11",
	"f12",
	"command",
	"alt",
	"control",
	"shift",
	"right_shift",
	"space",
	"printscreen",
	"insert",
	"audio_mute",
	"audio_vol_down",
	"audio_vol_up",
	"audio_play",
	"audio_stop",
	"audio_pause",
	"audio_prev",
	"audio_next",
	"audio_rewind",
	"audio_forward",
	"audio_repeat",
	"audio_random",
	"numpad_0",
	"numpad_1",
	"numpad_2",
	"numpad_3",
	"numpad_4",
	"numpad_5",
	"numpad_6",
	"numpad_7",
	"numpad_8",
	"numpad_9",
	"lights_mon_up",
	"lights_mon_down",
	"lights_kbd_toggle",
	"lights_kbd_up",
	"lights_kbd_down",
	"0",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"a",
	"b",
	"c",
	"d",
	"e",
	"f",
	"g",
	"h",
	"i",
	"j",
	"k",
	"l",
	"m",
	"n",
	"o",
	"p",
	"q",
	"r",
	"s",
	"t",
	"u",
	"v",
	"w",
	"x",
	"y",
	"z",
]

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
				robot.keyToggle(keyData.key, 'down');

				let pressLength = keyData.time || 0.1;

				await sleep(pressLength * 1000);

				robot.keyToggle(keyData.key, 'up')
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
							return ['left', 'right', 'middle']
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
				robot.mouseToggle('down', mouseData.button)

				let pressLength = mouseData.time || 0.1;

				await sleep(pressLength * 1000);

				robot.mouseToggle('up', mouseData.button)
			}
		}
	}
}