import {
	SchemaObj,
	Schema,
	SchemaType,
	defineSchema,
	SchemaConstructor,
	squashSchemas,
	SquashedSchemas,
} from "castmate-schema"
import { Reactive } from "../reactivity/reactivity"
import { ResourceRegistry } from "./resource-registry"
import { ConstructedType } from "../util/type-helpers"

export interface ResourceBase {
	readonly id: string
	readonly config: any
	state: any
}

export class ResourceStorage<T extends ResourceBase> {
	private resources: Array<T> = []

	getById(id: string) {
		return this.resources.find((r) => r.id == id)
	}

	get length() {
		return this.resources.length
	}

	*[Symbol.iterator]() {
		for (let r of this.resources) {
			yield r as T
		}
	}

	inject(...resources: T[]) {
		this.resources.push(...resources)
		//TODO: Notify UI
	}
}

export interface ResourceConstructor<T extends ResourceBase = any> {
	new (...args: any[]): T
	create?(config: object): Promise<T>
	load?(): Promise<void>
	storage: ResourceStorage<T>
}

export function RegisterResource<TConstructor extends ResourceConstructor>(
	target: TConstructor,
	context: ClassDecoratorContext<TConstructor>
) {
	context.addInitializer(function () {
		if (context.name != null) {
			//ResourceRegistry.getInstance().register(context.name, target)
			//Register here
		} else {
			throw new Error("Resources cannot be anonymous classes.")
		}
	})
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

	static async init() {
		//@ts-ignore
		ResourceRegistry.getInstance().register(this.name, this)
	}

	static async uninit() {
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
