const bindings = require("bindings")
const EventEmitter = require("events")

// console.log("Root?", __dirname)

const { NativeAudioDeviceInterface, OsTTSInterface } = bindings({
	bindings: "castmate-plugin-sound-native",
	// module_root: bindings.getRoot(import.meta.url),
})

class AudioDeviceInterface extends EventEmitter {
	constructor() {
		super()
		const boundEmit = this.emit.bind(this)
		this._native = new NativeAudioDeviceInterface(boundEmit)
	}

	getDevices() {
		return this._native.getDevices()
	}

	getDefaultOutput(type) {
		return this._native.getDefaultOutput(type)
	}

	getDefaultInput(type) {
		return this._native.getDefaultInput(type)
	}
}

module.exports = { AudioDeviceInterface, OsTTSInterface }
