const ffi = require('ffi-napi');

const { K, DStruct } = require('win32-api');
const kernel32 = K.load();

const ref = require('ref-napi');
const Struct = require('ref-struct-di')(ref);


const { sleep } = require('../utils/sleep.js');

const keys = {
	backspace: 0x08,
	tab: 0x09,
	enter: 0x0D,
	shift: 0x10,
	ctrl: 0x11,
	pause: 0x13,
	capslock: 0x14,
	escape: 0x1B,
	space: 0x20,
	end: 0x23,
	home: 0x24,
	left: 0x25,
	up: 0x26,
	right: 0x27,
	down: 0x28,
	insert: 0x2D,
	delete: 0x2E,
	"0": 0x30,
	"1": 0x31,
	"2": 0x32,
	"3": 0x33,
	"4": 0x34,
	"5": 0x35,
	"6": 0x36,
	"7": 0x37,
	"8": 0x38,
	"9": 0x39,
	a: 0x41,
	b: 0x42,
	c: 0x43,
	d: 0x44,
	e: 0x45,
	f: 0x46,
	g: 0x47,
	h: 0x48,
	i: 0x49,
	j: 0x4A,
	k: 0x4B,
	l: 0x4C,
	m: 0x4D,
	n: 0x4E,
	o: 0x4F,
	p: 0x50,
	q: 0x51,
	r: 0x52,
	s: 0x53,
	t: 0x54,
	u: 0x55,
	v: 0x56,
	w: 0x57,
	x: 0x58,
	y: 0x59,
	z: 0x5A,
}

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

const user32Lib = ffi.Library('user32', {
	'SendInput': ['uint32', ['uint32', "pointer", 'int32']],
	'MapVirtualKeyExA': ['uint32', ['uint32', 'uint32', 'uint64']],
	'GetKeyboardLayout': ['uint64', ['uint32']]
})

module.exports = {
	name: "inputs",
	uiName: "Input Simulation",
	async init()
	{
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
					console.log("VK Error", error);
				}
			}
		},
		sendClick(button, up)
		{
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
			}

			let inputStruct = new INPUT_MOUSE();

			inputStruct.type = 0;
			inputStruct.mi.dwFlags = flags;
			inputStruct.mi.dx = 0;
			inputStruct.mi.dy = 0;
			inputStruct.mi.time = 0;
			inputStruct.mi.mouseData = 0;
			inputStruct.mi.dwExtraInfo = 0;

			let success = user32Lib.SendInput(1, inputStruct.ref(), INPUT_KEYBOARD.size);
			if (success != 1)
			{
				let error = kernel32.GetLastError();
				if (error)
				{
					console.log("VK Error", error);
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
			color: "#826262",
			data: {
				type: Object,
				properties: {
					key: { type: String, name: "Key" },
					time: { type: Number, name: "Press Time" }
				}
			},
			async handler(keyData)
			{
				this.sendKey(keyData.key, false)

				let pressLength = keyData.time || 0.1;

				await sleep(pressLength * 1000);

				this.sendKey(keyData.key, true);
			}
		},
		mouseButton: {
			name: "Mouse Button",
			description: "Presses a mouse button",
			color: "#826262",
			data: {
				type: Object,
				properties: {
					button: { type: Number, name: "Mouse Button" },
					time: { type: Number, name: "Press Time" }
				}
			},
			async handler(mouseData)
			{
				let button = mouseData.button || 1;

				this.sendClick(button, false)

				let pressLength = mouseData.time || 0.1;

				await sleep(pressLength * 1000);

				this.sendClick(button, true);
			}
		}
	}
}