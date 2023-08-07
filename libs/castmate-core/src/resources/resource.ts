import {
	SchemaObj,
	Schema,
	SchemaType,
	defineSchema,
	SchemaConstructor,
	squashSchemas,
	SquashedSchemas,
} from "castmate-schema"
import { Reactive, ReactiveEffect, autoRerun } from "../reactivity/reactivity"
import { ResourceRegistry } from "./resource-registry"
import { ConstructedType } from "../util/type-helpers"
import { defineCallableIPC } from "../util/electron"

interface ResourceIPCDescription {
	id: string
	config: object
	state: object
}

export interface ResourceBase {
	readonly id: string
	readonly config: object
	state: object
	toIPC(): ResourceIPCDescription
}

const rendererAddResource = defineCallableIPC<(type: string, data: ResourceIPCDescription) => void>(
	"resources",
	"addResource"
)
const rendererDeleteResource = defineCallableIPC<(id: string) => void>("resources", "deleteResource")
const rendererUpdateResourceInternal = defineCallableIPC<(data: ResourceIPCDescription) => void>(
	"resources",
	"updateResource"
)

async function rendererUpdateResource(resource: ResourceBase) {
	await rendererUpdateResourceInternal(resource.toIPC())
}

interface ResourceEntry<T extends ResourceBase> {
	resource: T
	stateEffect: ReactiveEffect
}

export interface ResourceStorageBase {
	readonly name: string
	getById(id: string): ResourceBase | undefined
	readonly length: number
	//iter?
	inject(...resources: ResourceBase[]): Promise<void>
	remove(id: string): void
}

export class ResourceStorage<T extends ResourceBase> implements ResourceStorageBase {
	private resources: Map<string, ResourceEntry<T>> = new Map()
	private _name: string

	constructor(name: string) {
		this._name = name
	}

	get name() {
		return this._name
	}

	getById(id: string) {
		return this.resources.get(id)?.resource
	}

	get length() {
		return this.resources.size
	}

	*[Symbol.iterator]() {
		for (let [id, r] of this.resources.entries()) {
			yield r.resource
		}
	}

	async inject(...resources: T[]) {
		for (let resource of resources) {
			await rendererAddResource(this.name, resource.toIPC())

			const stateEffect = await autoRerun(() => rendererUpdateResource(resource))

			this.resources.set(resource.id, {
				resource,
				stateEffect,
			})
		}
	}

	remove(id: string) {
		const entry = this.resources.get(id)
		if (entry) {
			rendererDeleteResource(id)
		}
	}
}

export interface ResourceConstructor<T extends ResourceBase = any> {
	new (...args: any[]): T
	create?(...args: any[]): Promise<T>
	onCreate?(resource: T): any
	load?(): Promise<void>
	storage: ResourceStorage<T>
}

export function isResourceConstructor(constructor: new (...args: any[]) => any): constructor is ResourceConstructor {
	const storageHaver = constructor as { storage?: ResourceStorage<any> }

	return storageHaver.storage != null
}

export class Resource<ConfigType extends object, StateType extends object = {}> implements ResourceBase {
	static storage: ResourceStorageBase

	protected _id: string
	get id() {
		return this._id
	}

	//Handle JSON.stringify
	toJSON() {
		return this.id
	}

	protected _config: ConfigType
	get config() {
		return this._config
	}

	private async updateUI() {
		if (!(this.constructor as ResourceConstructor).storage.getById(this.id)) {
			//We haven't been injected yet, do not update the UI
			return
		}
		rendererUpdateResource(this)
	}

	async setConfig(config: ConfigType) {
		this._config = config
		await this.updateUI()
	}

	async applyConfig(config: Partial<ConfigType>) {
		Object.assign(this._config, config)
		await this.updateUI()
	}

	toIPC() {
		return {
			id: this.id,
			config: this.config,
			state: this.state,
		}
	}

	//@Reactive
	accessor state: StateType

	static async initialize() {
		//@ts-ignore
		ResourceRegistry.getInstance().register(this)
	}

	static async uninitialize() {
		//@ts-ignore
		ResourceRegistry.getInstance().unregister(this)
	}
}

/*
interface LightConfig {
	brand: string
	supportsColor: boolean
	supportsColorTemp: boolean
	minColorTemp?: number
	maxColorTemp?: number
}

interface LightState {
	color: string
}


@RegisterResource
class Light extends Resource<LightConfig, LightState> {
	static async load() {
		super.load()
	}
}

class BrandLight extends Light {
	static async load() {}

	static async unload() {}
}
*/
