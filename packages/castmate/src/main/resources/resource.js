import _ from "lodash"
import { callIpcFunc, ipcFunc } from "../utils/electronBridge"
import { nanoid } from "nanoid/non-secure"
import fs from "fs"
import path from "path"
import { ensureFolder, userFolder } from "../utils/configuration"
import YAML from "yaml"
import { ResourceManager } from "./resource-manager"
import { cleanSchemaForIPC } from "../utils/schema"
import logger from "../utils/logger"
import { Analytics } from "../utils/analytics"
import _cloneDeep from "lodash/cloneDeep"
import { isReactive, onAllStateChange } from "../state/reactive"
import { Mutex } from "async-mutex"

export class Resource {
	constructor(type, spec) {
		this.spec = spec
		this.resourceType = type
		type.resourceContainer = this
		this.resources = []
		this.resourceMutex = new Mutex()

		this.createIOFuncs()

		ResourceManager.getInstance().registerResource(this)
	}

	get name() {
		return this.spec.name || this.spec.type
	}

	get type() {
		return this.spec.type
	}

	toIpcDescription() {
		const desc = {
			type: this.type,
			name: this.name,
			typePlural: this.spec.typePlural
				? this.spec.typePlural
				: `${this.spec.type}s`,
			inlineEdit: this.spec.inlineEdit ?? false,
			description: this.spec.description,
			config: cleanSchemaForIPC(
				`${this.spec.type}_config`,
				this.spec.config
			),
		}
		return desc
	}

	_transformForIPC(resource) {
		if (!resource) return undefined
		return {
			id: resource.id,
			config: resource.config,
			...(resource.state ? { state: resource.state } : {}),
		}
	}

	_triggerUpdate() {
		const result = this.resources.map((r) => this._transformForIPC(r))
		/*console.log(
			"Updating",
			this.spec.type,
			result.map((o) => o.id)
		)*/
		callIpcFunc("resources_updateResourceArray", this.spec.type, result)
	}

	getById(id) {
		return this.resources.find((r) => r.id === id)
	}

	async create(config) {
		const hasStaticCreate = _.isFunction(this.resourceType.create)

		console.log("Creating", this.name, " with ", config)

		const newResource = hasStaticCreate
			? await this.resourceType.create(config)
			: new this.resourceType(config)

		if (!newResource) return null

		await this.inject(newResource)

		Analytics.getInstance().track("resourceCreated", {
			type: this.name,
			name: config.name,
		})

		return newResource
	}

	_setupReactivity(newResource) {
		if (isReactive(newResource.state)) {
			newResource._stateUpdaters = onAllStateChange(
				newResource.state,
				(key) => {
					callIpcFunc(
						"resources_updateResourceState",
						this.spec.type,
						newResource.id,
						key,
						newResource.state[key]
					)
				}
			)
		}
	}

	async inject(newResource) {
		if (!newResource) {
			console.log("Failed Injecting Resource", newResource)
			return
		}
		this._setupReactivity(newResource)

		console.log("Injecting", this.spec.type, newResource.id)

		const release = await this.resourceMutex.acquire()
		this.resources.push(newResource)
		release()

		this._triggerUpdate()
	}

	//Deletes without analytics
	async deleteByIdInternal(id) {
		const idx = this.resources.findIndex((r) => r.id === id)
		if (idx == -1) return

		const r = this.resources[idx]
		await r.deleteSelf?.()

		const release = await this.resourceMutex.acquire()
		this.resources.splice(idx, 1)
		release()

		this._triggerUpdate()
	}

	async deleteMany(ids) {
		//There's a better way to do this. Too bad!
		const release = await this.resourceMutex.acquire()
		const indices = ids
			.map((id) => this.resources.findIndex((r) => r.id === id))
			.filter((idx) => idx != -1)
			.sort((a, b) => a - b)

		let removed = 0
		for (let idx of indices) {
			const actualIdx = idx - removed

			console.log(
				"DELETING",
				this.resources[actualIdx].toIpcDescription()
			)

			await this.resources[actualIdx]?.deleteSelf?.()

			this.resources.splice(actualIdx, 1)
			removed += 1
		}
		release()

		this._triggerUpdate()
	}

	async load() {
		logger.info(`Loading ${this.name} Resources`)

		this.resources.push(...(await this.resourceType.load()))

		for (let resource of this.resources) {
			this._setupReactivity(resource)
		}

		this._triggerUpdate()
	}

	async clear() {
		const release = await this.resourceMutex.acquire()
		this.resources = []
		release()

		this._triggerUpdate()
	}

	async deleteById(id) {
		await this.deleteByIdInternal(id)

		Analytics.getInstance().track("resourceDeleted", {
			type: this.name,
			name: r.config?.name,
		})
	}

	async clone(id) {
		const r = this.getById(id)
		if (!r) return

		if (_.isFunction(r.clone)) {
			const newResource = await r.clone()

			this.resources.push(newResource)
			this._triggerUpdate()

			return newResource
		} else {
			return await this.create(r.config)
		}
	}

	createIOFuncs() {
		ipcFunc("resources", `${this.type}_get`, async () => {
			let release
			try {
				release = await this.resourceMutex.acquire()
				const result = this.resources.map((r) =>
					this._transformForIPC(r)
				) //????
				//console.log("Resources", this.type, result)
				return result
			} finally {
				release()
			}
		})

		ipcFunc("resources", `${this.type}_getById`, (id) => {
			return this._transformForIPC(this.getById(id))
		})

		ipcFunc("resources", `${this.type}_setConfig`, async (id, config) => {
			const r = this.getById(id)
			if (!r) return null
			await r.setConfig(config)

			Analytics.getInstance().track("updateResource", {
				type: this.name,
				name: r.config.name,
			})

			this._triggerUpdate()
			return this._transformForIPC(r)
		})

		ipcFunc(
			"resources",
			`${this.type}_updateConfig`,
			async (id, configUpdate) => {
				const r = this.getById(id)

				if (!r) return

				const newConfig = _cloneDeep(r.config)
				Object.assign(newConfig, configUpdate)

				Analytics.getInstance().track("updateResource", {
					type: this.name,
					name: r.config.name,
				})

				await r.setConfig(newConfig)
				this._triggerUpdate()

				return this._transformForIPC(r)
			}
		)

		ipcFunc("resources", `${this.type}_create`, async (config) => {
			return this._transformForIPC(await this.create(config))
		})

		ipcFunc("resources", `${this.type}_delete`, async (id) => {
			await this.deleteById(id)
		})

		ipcFunc("resources", `${this.type}_clone`, async (id) => {
			return this._transformForIPC(await this.clone(id))
		})
	}
}

export class FileResource {
	static async create(config) {
		const instance = new this()

		instance.config = config
		if (!instance.id) {
			instance.id = nanoid()
		}

		instance.onLoaded?.()
		const dir = path.join(userFolder, this.storageFolder)
		ensureFolder(dir)
		await fs.promises.writeFile(
			path.join(dir, `${instance.id}.yaml`),
			YAML.stringify(instance.config),
			"utf-8"
		)

		return instance
	}

	static async load() {
		const dir = path.join(userFolder, this.storageFolder)
		ensureFolder(dir)

		let files = await fs.promises.readdir(dir)
		files = files.filter((f) => path.extname(f) == ".yaml")

		const instances = await Promise.all(
			files.map(async (file) => {
				const filename = path.join(dir, file)

				try {
					const str = await fs.promises.readFile(filename, "utf-8")
					const yaml = YAML.parse(str)
					const instance = new this()
					instance.id = path.basename(file, ".yaml")
					instance.config = yaml
					instance.onLoaded?.()
					return instance
				} catch (err) {}
				return null
			})
		)

		return instances.filter((i) => !!i)
	}

	async clone() {
		return await this.constructor.create(this.config)
	}

	async setConfig(config) {
		this.config = config
		await fs.promises.writeFile(
			path.join(
				userFolder,
				this.constructor.storageFolder,
				`${this.id}.yaml`
			),
			YAML.stringify(config),
			"utf-8"
		)
	}

	async deleteSelf() {
		await fs.promises.unlink(
			path.join(
				userFolder,
				this.constructor.storageFolder,
				`${this.id}.yaml`
			)
		)
	}
}
