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

export interface ResourceBase {
	readonly id: string
	readonly config: any
	state: any
}

const rendererAddResource = defineCallableIPC<(type: string, data: ResourceBase) => void>("resources", "addResource")
const rendererDeleteResource = defineCallableIPC<(id: string) => void>("resources", "deleteResource")
const rendererUpdateResource = defineCallableIPC<(data: ResourceBase) => void>("resources", "updateResource")

interface ResourceEntry<T extends ResourceBase> {
	resource: T
	stateEffect: ReactiveEffect
}

export class ResourceStorage<T extends ResourceBase> {
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
			await rendererAddResource(this.name, { id: resource.id, config: resource.config, state: resource.state })

			const stateEffect = await autoRerun(() =>
				rendererUpdateResource({
					id: resource.id,
					config: resource.config,
					state: resource.state,
				})
			)

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
	create?(config: object): Promise<T>
	load?(): Promise<void>
	storage: ResourceStorage<T>
}

export class Resource<ConfigType extends object, StateType extends object = {}> implements ResourceBase {
	readonly id: string

	//Handle JSON.stringify
	toJSON() {
		return this.id
	}

	private _config: ConfigType
	get config() {
		return this._config
	}

	async setConfig(config: Partial<ConfigType>) {
		Object.assign(this._config, config)
	}

	toIPC() {
		return {
			id: this.id,
			config: this.config,
			state: this.state,
		}
	}

	@Reactive
	accessor state: StateType

	static async initialize() {
		//@ts-ignore
		ResourceRegistry.getInstance().register(this.name, this)
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
