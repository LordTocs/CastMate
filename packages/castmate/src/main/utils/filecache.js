import fs from "fs"
import yaml from "yaml"
import { safeStorage } from "./electronBridge.js"

export class FileCache {
	constructor(filePath, secret = false) {
		this.path = filePath
		this.secret = secret
		this.data = null
	}

	async _writeData() {
		const strdata = yaml.stringify(this.data)
		if (this.secret) {
			const buffer = safeStorage.encryptString(strdata)
			await fs.promises.writeFile(this.path, buffer)
		} else {
			await fs.promises.writeFile(this.path, strdata, "utf-8")
		}
	}

	async _readData() {
		let strdata = null
		try {
			if (this.secret) {
				const secretBuffer = await fs.promises.readFile(this.path)
				strdata = safeStorage.decryptString(secretBuffer)
			} else {
				strdata = await fs.promises.readFile(this.path, "utf-8")
			}
			this.data = yaml.parse(strdata)
		} catch (err) {}
	}

	async get() {
		if (!this.data) {
			await this._readData()
		}

		return this.data
	}

	async set(data) {
		this.data = data
		await this._writeData()
	}

	async update(data) {
		Object.apply(this.data, data)
		await this._writeData()
	}
}
