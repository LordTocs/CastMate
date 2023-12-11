const bindings = require("bindings")
const EventEmitter = require("events")

// console.log("Root?", __dirname)

const { NativeAudioDeviceInterface } = bindings({
	bindings: "castmate-plugin-sound-native",
	// module_root: bindings.getRoot(import.meta.url),
})

class AudioDeviceInterface extends EventEmitter {
	constructor() {
		super()
		const boundEmit = this.emit.bind(this)
		console.log("Passing Bound Emit", boundEmit)
		this._native = new NativeAudioDeviceInterface(boundEmit)
	}

	getDevices() {
		return this._native.getDevices()
	}
}

module.exports = { AudioDeviceInterface }
