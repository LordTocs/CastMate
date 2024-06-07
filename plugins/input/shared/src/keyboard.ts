import { DataFactory, SchemaBase, mapKeys, registerType } from "castmate-schema"

interface KeyInfo {
	windowsVKCode: number
	electronAccelerator: string
	sortPriority: number
}

export const Keys = {
	Space: { windowsVKCode: 0x20, electronAccelerator: "Space", sortPriority: 1 },
	Escape: { windowsVKCode: 0x1b, electronAccelerator: "Escape", sortPriority: 1 },
	Tab: { windowsVKCode: 0x09, electronAccelerator: "Tab", sortPriority: 1 },
	LeftAlt: { windowsVKCode: 0x12, electronAccelerator: "Alt", sortPriority: 3 },
	LeftControl: { windowsVKCode: 0x11, electronAccelerator: "Control", sortPriority: 4 },
	RightAlt: { windowsVKCode: 0x12, electronAccelerator: "Alt", sortPriority: 3 },
	RightControl: { windowsVKCode: 0x11, electronAccelerator: "Control", sortPriority: 4 },
	LeftShift: { windowsVKCode: 0x10, electronAccelerator: "Shift", sortPriority: 2 },
	RightShift: { windowsVKCode: 0x10, electronAccelerator: "Shift", sortPriority: 2 },
	F1: { windowsVKCode: 0x70, electronAccelerator: "F1", sortPriority: 1 },
	F2: { windowsVKCode: 0x71, electronAccelerator: "F2", sortPriority: 1 },
	F3: { windowsVKCode: 0x72, electronAccelerator: "F3", sortPriority: 1 },
	F4: { windowsVKCode: 0x73, electronAccelerator: "F4", sortPriority: 1 },
	F5: { windowsVKCode: 0x74, electronAccelerator: "F5", sortPriority: 1 },
	F6: { windowsVKCode: 0x75, electronAccelerator: "F6", sortPriority: 1 },
	F7: { windowsVKCode: 0x76, electronAccelerator: "F7", sortPriority: 1 },
	F8: { windowsVKCode: 0x77, electronAccelerator: "F8", sortPriority: 1 },
	F9: { windowsVKCode: 0x78, electronAccelerator: "F9", sortPriority: 1 },
	F10: { windowsVKCode: 0x7a, electronAccelerator: "F10", sortPriority: 1 },
	F11: { windowsVKCode: 0x7b, electronAccelerator: "F11", sortPriority: 1 },
	F12: { windowsVKCode: 0x7c, electronAccelerator: "F12", sortPriority: 1 },
	F13: { windowsVKCode: 0x7d, electronAccelerator: "F13", sortPriority: 1 },
	F14: { windowsVKCode: 0x7e, electronAccelerator: "F14", sortPriority: 1 },
	F15: { windowsVKCode: 0x7f, electronAccelerator: "F15", sortPriority: 1 },
	F16: { windowsVKCode: 0x80, electronAccelerator: "F16", sortPriority: 1 },
	F17: { windowsVKCode: 0x81, electronAccelerator: "F17", sortPriority: 1 },
	F18: { windowsVKCode: 0x82, electronAccelerator: "F18", sortPriority: 1 },
	F19: { windowsVKCode: 0x83, electronAccelerator: "F19", sortPriority: 1 },
	F20: { windowsVKCode: 0x84, electronAccelerator: "F20", sortPriority: 1 },
	F21: { windowsVKCode: 0x85, electronAccelerator: "F21", sortPriority: 1 },
	F22: { windowsVKCode: 0x86, electronAccelerator: "F22", sortPriority: 1 },
	F23: { windowsVKCode: 0x87, electronAccelerator: "F23", sortPriority: 1 },
	F24: { windowsVKCode: 0x88, electronAccelerator: "F24", sortPriority: 1 },
	"0": { windowsVKCode: 0x30, electronAccelerator: "0", sortPriority: 1 },
	"1": { windowsVKCode: 0x31, electronAccelerator: "1", sortPriority: 1 },
	"2": { windowsVKCode: 0x32, electronAccelerator: "2", sortPriority: 1 },
	"3": { windowsVKCode: 0x33, electronAccelerator: "3", sortPriority: 1 },
	"4": { windowsVKCode: 0x34, electronAccelerator: "4", sortPriority: 1 },
	"5": { windowsVKCode: 0x35, electronAccelerator: "5", sortPriority: 1 },
	"6": { windowsVKCode: 0x36, electronAccelerator: "6", sortPriority: 1 },
	"7": { windowsVKCode: 0x37, electronAccelerator: "7", sortPriority: 1 },
	"8": { windowsVKCode: 0x38, electronAccelerator: "8", sortPriority: 1 },
	"9": { windowsVKCode: 0x39, electronAccelerator: "9", sortPriority: 1 },
	A: { windowsVKCode: 0x41, electronAccelerator: "A", sortPriority: 1 },
	B: { windowsVKCode: 0x42, electronAccelerator: "B", sortPriority: 1 },
	C: { windowsVKCode: 0x43, electronAccelerator: "C", sortPriority: 1 },
	D: { windowsVKCode: 0x44, electronAccelerator: "D", sortPriority: 1 },
	E: { windowsVKCode: 0x45, electronAccelerator: "E", sortPriority: 1 },
	F: { windowsVKCode: 0x46, electronAccelerator: "F", sortPriority: 1 },
	G: { windowsVKCode: 0x47, electronAccelerator: "G", sortPriority: 1 },
	H: { windowsVKCode: 0x48, electronAccelerator: "H", sortPriority: 1 },
	I: { windowsVKCode: 0x49, electronAccelerator: "I", sortPriority: 1 },
	J: { windowsVKCode: 0x4a, electronAccelerator: "J", sortPriority: 1 },
	K: { windowsVKCode: 0x4b, electronAccelerator: "K", sortPriority: 1 },
	L: { windowsVKCode: 0x4c, electronAccelerator: "L", sortPriority: 1 },
	M: { windowsVKCode: 0x4d, electronAccelerator: "M", sortPriority: 1 },
	N: { windowsVKCode: 0x4e, electronAccelerator: "N", sortPriority: 1 },
	O: { windowsVKCode: 0x4f, electronAccelerator: "O", sortPriority: 1 },
	P: { windowsVKCode: 0x50, electronAccelerator: "P", sortPriority: 1 },
	Q: { windowsVKCode: 0x51, electronAccelerator: "Q", sortPriority: 1 },
	R: { windowsVKCode: 0x52, electronAccelerator: "R", sortPriority: 1 },
	S: { windowsVKCode: 0x53, electronAccelerator: "S", sortPriority: 1 },
	T: { windowsVKCode: 0x54, electronAccelerator: "T", sortPriority: 1 },
	U: { windowsVKCode: 0x55, electronAccelerator: "U", sortPriority: 1 },
	V: { windowsVKCode: 0x56, electronAccelerator: "V", sortPriority: 1 },
	W: { windowsVKCode: 0x57, electronAccelerator: "W", sortPriority: 1 },
	X: { windowsVKCode: 0x58, electronAccelerator: "X", sortPriority: 1 },
	Y: { windowsVKCode: 0x59, electronAccelerator: "Y", sortPriority: 1 },
	Z: { windowsVKCode: 0x5a, electronAccelerator: "Z", sortPriority: 1 },
	Minus: { windowsVKCode: 0xbb, electronAccelerator: "-", sortPriority: 1 },
	Equals: { windowsVKCode: 0xbb, electronAccelerator: "=", sortPriority: 1 },
	Backspace: { windowsVKCode: 0x08, electronAccelerator: "Backspace", sortPriority: 1 },
	LeftBracket: { windowsVKCode: 0xdb, electronAccelerator: "[", sortPriority: 1 },
	RightBracket: { windowsVKCode: 0xdd, electronAccelerator: "]", sortPriority: 1 },
	Backslash: { windowsVKCode: 0xdc, electronAccelerator: "\\", sortPriority: 1 },
	Semicolon: { windowsVKCode: 0xba, electronAccelerator: ";", sortPriority: 1 },
	Quote: { windowsVKCode: 0xde, electronAccelerator: '"', sortPriority: 1 },
	Enter: { windowsVKCode: 0x0d, electronAccelerator: "Enter", sortPriority: 1 },
	Comma: { windowsVKCode: 0xbc, electronAccelerator: ",", sortPriority: 1 },
	Period: { windowsVKCode: 0xbe, electronAccelerator: ".", sortPriority: 1 },
	Slash: { windowsVKCode: 0xbf, electronAccelerator: "/", sortPriority: 1 },
	Left: { windowsVKCode: 0x25, electronAccelerator: "Left", sortPriority: 1 },
	Up: { windowsVKCode: 0x26, electronAccelerator: "Up", sortPriority: 1 },
	Right: { windowsVKCode: 0x27, electronAccelerator: "Right", sortPriority: 1 },
	Down: { windowsVKCode: 0x28, electronAccelerator: "Down", sortPriority: 1 },
	PrintScreen: { windowsVKCode: 0x2c, electronAccelerator: "", sortPriority: 1 },
	Pause: { windowsVKCode: 0x13, electronAccelerator: "", sortPriority: 1 },
	Insert: { windowsVKCode: 0x2d, electronAccelerator: "Insert", sortPriority: 1 },
	Delete: { windowsVKCode: 0x2e, electronAccelerator: "Delete", sortPriority: 1 },
	Home: { windowsVKCode: 0x24, electronAccelerator: "Home", sortPriority: 1 },
	End: { windowsVKCode: 0x23, electronAccelerator: "End", sortPriority: 1 },
	PageUp: { windowsVKCode: 0x21, electronAccelerator: "PageUp", sortPriority: 1 },
	PageDown: { windowsVKCode: 0x22, electronAccelerator: "PageDown", sortPriority: 1 },
	Add: { windowsVKCode: 0x6b, electronAccelerator: "numadd", sortPriority: 1 },
	Subtract: { windowsVKCode: 0x6d, electronAccelerator: "numsub", sortPriority: 1 },
	Multiply: { windowsVKCode: 0x6a, electronAccelerator: "nummult", sortPriority: 1 },
	Divide: { windowsVKCode: 0x6f, electronAccelerator: "numdiv", sortPriority: 1 },
	Decimal: { windowsVKCode: 0x6e, electronAccelerator: "numdec", sortPriority: 1 },
	NumPad0: { windowsVKCode: 0x60, electronAccelerator: "num0", sortPriority: 1 },
	NumPad1: { windowsVKCode: 0x61, electronAccelerator: "num1", sortPriority: 1 },
	NumPad2: { windowsVKCode: 0x62, electronAccelerator: "num2", sortPriority: 1 },
	NumPad3: { windowsVKCode: 0x63, electronAccelerator: "num3", sortPriority: 1 },
	NumPad4: { windowsVKCode: 0x64, electronAccelerator: "num4", sortPriority: 1 },
	NumPad5: { windowsVKCode: 0x65, electronAccelerator: "num5", sortPriority: 1 },
	NumPad6: { windowsVKCode: 0x66, electronAccelerator: "num6", sortPriority: 1 },
	NumPad7: { windowsVKCode: 0x67, electronAccelerator: "num7", sortPriority: 1 },
	NumPad8: { windowsVKCode: 0x68, electronAccelerator: "num8", sortPriority: 1 },
	NumPad9: { windowsVKCode: 0x69, electronAccelerator: "num9", sortPriority: 1 },
	CapsLock: { windowsVKCode: 0x14, electronAccelerator: "Capslock", sortPriority: 1 },
	ScrollLock: { windowsVKCode: 0x91, electronAccelerator: "Scrollock", sortPriority: 1 },
	NumLock: { windowsVKCode: 0x90, electronAccelerator: "Numlock", sortPriority: 1 },
	AudioMute: { windowsVKCode: 0xad, electronAccelerator: "VolumeMute", sortPriority: 1 },
	AudioVolDown: { windowsVKCode: 0xae, electronAccelerator: "VolumeDown", sortPriority: 1 },
	AudioVolUp: { windowsVKCode: 0xaf, electronAccelerator: "VolumeUp", sortPriority: 1 },
	MediaPlay: { windowsVKCode: 0xb3, electronAccelerator: "MediaPlayPause", sortPriority: 1 },
	MediaStop: { windowsVKCode: 0xb2, electronAccelerator: "MediaStop", sortPriority: 1 },
	MediaPause: { windowsVKCode: 0xb3, electronAccelerator: "MediaPlayPause", sortPriority: 1 },
	MediaPrev: { windowsVKCode: 0xb1, electronAccelerator: "MediaPreviousTrack", sortPriority: 1 },
	MediaNext: { windowsVKCode: 0xb0, electronAccelerator: "MediaNextTrack", sortPriority: 1 },
}

export const VKToKey: Record<number, KeyboardKey> = {}

for (const keyName in Keys) {
	const key = Keys[keyName as KeyboardKey]
	if (key.windowsVKCode in VKToKey) continue
	VKToKey[key.windowsVKCode] = keyName as KeyboardKey
}

//https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
export const JSKeys: Record<string, KeyboardKey> = {
	a: "A",
	A: "A",
	b: "B",
	B: "B",
	c: "C",
	C: "C",
	d: "D",
	D: "D",
	e: "E",
	E: "E",
	f: "F",
	F: "F",
	g: "G",
	G: "G",
	h: "H",
	H: "H",
	i: "I",
	I: "I",
	j: "J",
	J: "J",
	k: "K",
	K: "K",
	l: "L",
	L: "L",
	m: "M",
	M: "M",
	n: "N",
	N: "N",
	o: "O",
	O: "O",
	p: "P",
	P: "P",
	q: "Q",
	Q: "Q",
	r: "R",
	R: "R",
	s: "S",
	S: "S",
	t: "T",
	T: "T",
	u: "U",
	U: "U",
	v: "V",
	V: "V",
	w: "W",
	W: "W",
	x: "X",
	X: "X",
	y: "Y",
	Y: "Y",
	z: "Z",
	Z: "Z",
	"1": "1",
	"!": "1",
	"2": "2",
	"@": "2",
	"3": "3",
	"#": "3",
	"4": "4",
	$: "4",
	"5": "5",
	"%": "5",
	"6": "6",
	"^": "6",
	"7": "7",
	"&": "7",
	"8": "8",
	"*": "8",
	"9": "9",
	"(": "9",
	"0": "0",
	")": "0",
	"-": "Minus",
	_: "Minus",
	"+": "Equals",
	"=": "Equals",
	"{": "LeftBracket",
	"[": "LeftBracket",
	"}": "RightBracket",
	"]": "RightBracket",
	"\\": "Backslash",
	"|": "Backslash",
	";": "Semicolon",
	":": "Semicolon",
	"'": "Quote",
	'"': "Quote",
	",": "Comma",
	"<": "Comma",
	".": "Period",
	">": "Period",
	"/": "Slash",
	"?": "Slash",
	" ": "Space",
	Tab: "Tab",
	Enter: "Enter",
	Alt: "LeftAlt",
	Control: "LeftControl",
	CapsLock: "CapsLock",
	NumLock: "NumLock",
	ScrollLock: "ScrollLock",
	Shift: "LeftShift",
	ArrowDown: "Down",
	ArrowUp: "Up",
	ArrowLeft: "Left",
	ArrowRight: "Right",
	End: "End",
	Home: "Home",
	PageDown: "PageDown",
	PageUp: "PageUp",
	Backspace: "Backspace",
	Delete: "Delete",
	Insert: "Insert",
	Escape: "Escape",
	Pause: "Pause",
	PrintScreen: "PrintScreen",
	F1: "F1",
	F2: "F2",
	F3: "F3",
	F4: "F4",
	F5: "F5",
	F6: "F6",
	F7: "F7",
	F8: "F8",
	F9: "F9",
	F10: "F10",
	F11: "F11",
	F12: "F12",
	F13: "F13",
	F14: "F14",
	F15: "F15",
	F16: "F16",
	F17: "F17",
	F18: "F18",
	F19: "F19",
	F20: "F20",
	MediaPause: "MediaPause",
	MediaPlay: "MediaPlay",
	MediaPlayPause: "MediaPlay",
	MediaTrackNext: "MediaNext",
	MediaTrackPrevious: "MediaPrev",
	AudioVolumeUp: "AudioVolUp",
	AudioVolumeDown: "AudioVolDown",
	AudioVolumeMute: "AudioMute",
	Decimal: "Decimal",
	Multiplay: "Multiply",
	Add: "Add",
	Divide: "Divide",
	Subtract: "Subtract",
}

export function getKeyboardKey(ev: KeyboardEvent) {
	let keyname = JSKeys[ev.key]
	if (keyname) {
		if (ev.location == ev.DOM_KEY_LOCATION_RIGHT) {
			keyname = keyname.replace("Left", "Right") as KeyboardKey
		}
		if (ev.location == ev.DOM_KEY_LOCATION_NUMPAD) {
			const num = Number(keyname)
			if (!isNaN(num)) {
				keyname = `NumPad${num}` as KeyboardKey
			}
		}
		return keyname
	}
	return undefined
}

export type KeyboardKey = keyof typeof Keys
type KeyboardKeyFactory = {
	factoryCreate(): KeyboardKey
	barbaz(): void
}
export const KeyboardKey: KeyboardKeyFactory = {
	factoryCreate() {
		return undefined as unknown as KeyboardKey
	},
	barbaz() {},
}

export interface SchemaKeyboardKey extends SchemaBase<KeyboardKey> {
	type: KeyboardKeyFactory
}

export function UnmirrorKey(key: KeyboardKey) {
	//converts right sided keys to left
	if (key.startsWith("Right")) {
		return `Left${key.substring(5)}` as KeyboardKey
	}
	return key
}

export function MirrorKey(key: KeyboardKey) {
	//converts right sided keys to left
	if (key.startsWith("Left")) {
		return `Right${key.substring(4)}` as KeyboardKey
	}
	return undefined
}

export type KeyCombo = Array<KeyboardKey>
type KeyComboFactory = {
	factoryCreate(): KeyCombo
	append(combo: KeyCombo, key: KeyboardKey): void
	equals(a: KeyCombo, b: KeyCombo): boolean
}
export const KeyCombo: KeyComboFactory = {
	factoryCreate(): KeyCombo {
		return []
	},
	append(combo: KeyCombo, key: KeyboardKey) {
		key = UnmirrorKey(key)
		if (combo.includes(key)) return
		combo.push(key)
		//sort
		combo.sort((a, b) => {
			const aKeyInfo = Keys[a]
			const bKeyInfo = Keys[b]

			if (!aKeyInfo) return 1
			if (!bKeyInfo) return -1

			const sortDiff = bKeyInfo.sortPriority - aKeyInfo.sortPriority

			if (sortDiff != 0) return sortDiff

			return a.localeCompare(b)
		})
	},
	equals(a: KeyCombo, b: KeyCombo) {
		if (!a) return false
		if (!b) return false
		if (a.length != b.length) return false

		for (let i = 0; i < a.length; ++i) {
			if (a[i] != b[i]) return false
		}
		return true
	},
}

export interface SchemaKeyCombo extends SchemaBase<KeyCombo> {
	type: KeyComboFactory
}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		KeyCombo: [SchemaKeyCombo, KeyCombo]
		KeyboardKey: [SchemaKeyboardKey, KeyboardKey]
	}
}

registerType("KeyboardKey", {
	constructor: KeyboardKey,
})

registerType("KeyCombo", {
	constructor: KeyCombo,
})
