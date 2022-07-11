const ffi = require('ffi-napi');
const { K, DStruct } = require('win32-api');
const kernel32 = K.load();

const ref = require('ref-napi');
const Struct = require('ref-struct-di')(ref);

const KEYBDINPUT = Struct(DStruct.KEYBDINPUT);
const MOUSEINPUT = Struct(DStruct.MOUSEINPUT);

const INPUT_KEYBOARD = Struct({
	type: "uint32",
	ki: KEYBDINPUT,
})

const INPUT_MOUSE = Struct({
	type: "uint32",
	mi: MOUSEINPUT,
})

INPUT_KEYBOARD.size = 40; //Manually set this to 40 because that's the sizeof(INPUT) due to the union.
INPUT_MOUSE.size = 40;

const user32Lib = ffi.Library('user32', {
	'SendInput': ['uint32', ['uint32', "pointer", 'int32']],
	'MapVirtualKeyExA': ['uint32', ['uint32', 'uint32', 'uint64']],
	'GetKeyboardLayout': ['uint64', ['uint32']]
})

const { sleep } = require('../utils/sleep.js');

//const keys = Object.keys(Key).filter(v => isNaN(parseInt(v)))
const buttons = {
    LEFT: 1,
    MIDDLE: 3,
    RIGHT: 2,
	BUTTON4: 4,
	BUTTON5: 5
}
//Object.keys(Button).filter(v => isNaN(parseInt(v)));

const keys = {
	Space: 0x20,
    Escape: 0x1B,
    Tab: 0x09,
    LeftAlt: 0xA4,
    LeftControl: 0xA2,
    RightAlt: 0xA5,
    RightControl: 0xA3,
    LeftShift: 0xA0,
    //LeftSuper = 8,
    RightShift: 0xA1,
    //RightSuper = 10,
    F1: 0x70,
    F2: 0x71,
    F3: 0x72,
    F4: 0x73,
    F5: 0x74,
    F6: 0x75,
    F7: 0x76,
    F8: 0x77,
    F9: 0x78,
    F10: 0x7A,
    F11: 0x7B,
    F12: 0x7C,
    F13: 0x7D,
    F14: 0x7E,
    F15: 0x7F,
    F16: 0x80,
    F17: 0x81,
    F18: 0x82,
    F19: 0x83,
    F20: 0x84,
    F21: 0x85,
    F22: 0x86,
    F23: 0x87,
    F24: 0x88,
    Num0: 0x30,
    Num1: 0x31,
    Num2: 0x32,
    Num3: 0x33,
    Num4: 0x34,
    Num5: 0x35,
    Num6: 0x36,
    Num7: 0x37,
    Num8: 0x38,
    Num9: 0x39,
    A: 0x41,
	B: 0x42,
	C: 0x43,
	D: 0x44,
	E: 0x45,
	F: 0x46,
	G: 0x47,
	H: 0x48,
	I: 0x49,
	J: 0x4A,
	K: 0x4B,
	L: 0x4C,
	M: 0x4D,
	N: 0x4E,
	O: 0x4F,
	P: 0x50,
	Q: 0x51,
	R: 0x52,
	S: 0x53,
	T: 0x54,
	U: 0x55,
	V: 0x56,
	W: 0x57,
	X: 0x58,
	Y: 0x59,
	Z: 0x5A,
    //Grave = 71,
    Minus: 0xBB,
    Equal: 0xBB, //??
    Backspace: 0x08,
    LeftBracket: 0xDB,
    RightBracket: 0xDD,
    Backslash: 0xDC,
    Semicolon: 0xBA,
    Quote: 0xDE,
    Return: 0x0D,
    Comma: 0xBC,
    Period: 0xBE,
    Slash: 0xBF,
    Left: 0x25,
    Up: 0x26,
    Right: 0x27,
    Down: 0x28,
    Print: 0x2A,
    Pause: 0x13,
    Insert: 0x2D,
    Delete: 0x2E,
    Home: 0x24,
    End: 0x23,
    PageUp: 0x21,
    PageDown: 0x22,
    Add: 0x6B,
    Subtract: 0x6D,
    Multiply: 0x6A,
    Divide: 0x6F,
    Decimal: 0x6E,
    Enter: 0x0D,
    NumPad0: 0x60,
    NumPad1: 0x61,
    NumPad2: 0x62,
    NumPad3: 0x63,
    NumPad4: 0x64,
    NumPad5: 0x65,
    NumPad6: 0x66,
    NumPad7: 0x67,
    NumPad8: 0x68,
    NumPad9: 0x69,
    CapsLock: 0x14,
    ScrollLock: 0x91,
    NumLock: 0x90,
    AudioMute: 0xAD,
    AudioVolDown: 0xAE,
    AudioVolUp: 0xAF,
    AudioPlay: 0xB3,
    AudioStop: 0xB2,
    AudioPause: 0xB3,
    AudioPrev: 0xB1,
    AudioNext: 0xB0,
}

module.exports = {
	name: "inputs",
	uiName: "Input Simulation",
	icon: "mdi-keyboard",
	color: "#826262",
	async init() {
	},
	methods: {
		sendKey(key, up)
		{
			let keyCode = keys[key];

			if (!keyCode)
				return;

			let inputStruct = new INPUT_KEYBOARD();

			inputStruct.type = 1;
			inputStruct.ki.dwFlags = (up ? 2 : 0) | 8;
			inputStruct.ki.time = 0;
			inputStruct.ki.wVk = 0;
			inputStruct.ki.wScan = user32Lib.MapVirtualKeyExA(keyCode, 0, user32Lib.GetKeyboardLayout(0));
			inputStruct.ki.dwExtraInfo = 0;

			let success = user32Lib.SendInput(1, inputStruct.ref(), INPUT_KEYBOARD.size);
			if (success != 1)
			{
				let error = kernel32.GetLastError();
				if (error)
				{
					this.logger.error(`VK Error ${error}`);
				}
			}
		},
		sendClick(buttonId, up)
		{
			const button = buttons[buttonId];
			
			let flags = 0;

			if (up)
			{
				if (button == 1)
				{
					flags = 0x0004;
				}
				else if (button == 2)
				{
					flags = 0x0010;
				}
				else if (button == 3)
				{
					flags = 0x0040;
				}
				else if (button == 4 || button == 5)
				{
					flags = 0x0100;
				}
			}
			else
			{
				if (button == 1)
				{
					flags = 0x0002;
				}
				else if (button == 2)
				{
					flags = 0x0008;
				}
				else if (button == 3)
				{
					flags = 0x0020;
				}
				else if (button == 4 || button == 5)
				{
					flags = 0x0080;
				}
			}

			let inputStruct = new INPUT_MOUSE();

			inputStruct.type = 0;
			inputStruct.mi.dwFlags = flags;
			inputStruct.mi.dx = 0;
			inputStruct.mi.dy = 0;
			inputStruct.mi.time = 0;
			inputStruct.mi.mouseData = 0;
			if (button == 4 || button == 5)
			{
				inputStruct.mi.mouseData = button - 3;
			}
			inputStruct.mi.dwExtraInfo = 0;

			let success = user32Lib.SendInput(1, inputStruct.ref(), INPUT_MOUSE.size);
			if (success != 1)
			{
				let error = kernel32.GetLastError();
				if (error)
				{
					this.logger.error(`SendInput Error ${error}`);
				}
			}
		}
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
							return Object.keys(keys)
						},
						required: true
					},
					time: {
						type: Number,
						name: "Press Time",
						default: 0.1,
						required: true,
						unit: { name: "Seconds", short: 's' }
					}
				}
			},
			async handler(keyData) {
				//robot.keyToggle(keyData.key, 'down');
				//await keyboard.pressKey(Key[keyData.key])

				this.sendKey(keyData.key, false)

				let pressLength = keyData.time || 0.1;

				await sleep(pressLength * 1000);

				//await keyboard.releaseKey(Key[keyData.key])
				this.sendKey(keyData.key, true)
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
						required: true,
						enum() {
							return Object.keys(buttons);
						}
					},
					time: {
						type: Number,
						name: "Press Time",
						default: 0.1,
						required: true,
						unit: { name: "Seconds", short: 's' }
					}
				}
			},
			async handler(mouseData) {
				//await mouse.pressButton(Button[mouseData.button])
				this.sendClick(mouseData.button, false);

				let pressLength = mouseData.time || 0.1;

				await sleep(pressLength * 1000);

				//await mouse.releaseButton(Button[mouseData.button])
				this.sendClick(mouseData.button, true);
			}
		}
	}
}