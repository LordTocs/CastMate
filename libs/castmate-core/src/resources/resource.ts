import _cloneDeep from "lodash/cloneDeep"
import { ReactiveEffect, ReactiveGet, ReactiveSet, autoRerun, rawify } from "../reactivity/reactivity"
import { ResourceRegistry } from "./resource-registry"
import { defineCallableIPC } from "../util/electron"
import {
	AsyncSchemaFunctionSetType,
	AsyncSchemaFuncType,
	mapKeys,
	MaybePromise,
	ResourceConstructionData,
	ResourceData,
	ResourceDataBase,
	ResourceSpecification,
	SchemaFunctionSetType,
	SchemaObject,
	SchemaType,
	testRes,
	TSchemaFunctionSet,
	TSchemaProperties,
} from "castmate-schema"
import { isObject } from "../util/type-helpers"
import { globalLogger } from "../logging/logging"

// interface ResourceIPCDescription {
// 	id: string
// 	config: object
// 	state: object
// }

// export interface ResourceBase extends ResourceData {
// 	toIPC(): ResourceIPCDescription
// 	setConfig(config: any): Promise<boolean>
// 	applyConfig(config: any): Promise<boolean>
// }

// const rendererAddResource = defineCallableIPC<(type: string, data: ResourceIPCDescription) => void>(
// 	"resources",
// 	"addResource"
// )
// const rendererDeleteResource = defineCallableIPC<(typeName: string, id: string) => void>("resources", "deleteResource")
// const rendererUpdateResourceInternal = defineCallableIPC<(typeName: string, data: ResourceIPCDescription) => void>(
// 	"resources",
// 	"updateResource"
// )

// async function rendererUpdateResource(typeName: string, resource: ResourceBase) {
// 	const ipcVersion = resource.toIPC()
// 	await rendererUpdateResourceInternal(typeName, ipcVersion)
// }

// interface ResourceEntry<T extends ResourceBase> {
// 	resource: T
// 	stateEffect: ReactiveEffect
// }

// export interface ResourceStorageBase {
// 	readonly name: string
// 	getById(id: string): ResourceBase | undefined
// 	readonly length: number
// 	//iter?
// 	inject(...resources: ResourceBase[]): Promise<void>
// 	remove(id: string): void
// 	[Symbol.iterator](): IterableIterator<ResourceBase>
// }

// export class ResourceStorage<T extends ResourceBase> implements ResourceStorageBase {
// 	private resources: Map<string, ResourceEntry<T>> = new Map()
// 	private _name: string

// 	constructor(name: string) {
// 		this._name = name
// 	}

// 	get name() {
// 		return this._name
// 	}

// 	getById(id: string) {
// 		return this.resources.get(id)?.resource
// 	}

// 	get length() {
// 		return this.resources.size
// 	}

// 	*[Symbol.iterator]() {
// 		for (let [id, r] of this.resources.entries()) {
// 			yield r.resource
// 		}
// 	}

// 	async inject(...resources: T[]) {
// 		for (let resource of resources) {
// 			await rendererAddResource(this.name, resource.toIPC())

// 			const stateEffect = await autoRerun(() => rendererUpdateResource(this.name, resource))

// 			this.resources.set(resource.id, {
// 				resource,
// 				stateEffect,
// 			})
// 		}
// 	}

// 	async remove(id: string) {
// 		globalLogger.log("Deleting", id)
// 		const entry = this.resources.get(id)
// 		if (entry) {
// 			//Run on delete first incase it throws
// 			const constructor = entry.resource.constructor as ResourceConstructor<T>
// 			await constructor.onDelete?.(entry.resource)

// 			this.resources.delete(id)
// 			entry.stateEffect.dispose()
// 			rendererDeleteResource(this.name, id)
// 		}
// 	}
// }

// export interface ResourceConstructor<T extends ResourceBase = any> {
// 	new (...args: any[]): T
// 	create?(...args: any[]): Promise<T>
// 	onCreate?(resource: T): any
// 	onDelete?(resource: T): any
// 	load?(): Promise<void>
// 	storage: ResourceStorage<T>
// 	initialize(): Promise<void>
// 	uninitialize(): Promise<void>
// }

// export function isResourceConstructor(constructor: any): constructor is ResourceConstructor {
// 	if (!constructor) return false
// 	const storageHaver = constructor as { storage?: ResourceStorage<any> }

// 	return storageHaver.storage != null
// }

// export function isResource(resource: any): resource is ResourceBase {
// 	if (!isObject(resource)) return false

// 	const constructor = resource.constructor
// 	if (!constructor) return false

// 	return isResourceConstructor(constructor)
// }

// export class Resource<ConfigType extends object, StateType extends object = {}> implements ResourceBase {
// 	static storage: ResourceStorageBase

// 	protected _id: string
// 	get id() {
// 		return this._id
// 	}

// 	//Handle JSON.stringify
// 	toJSON() {
// 		return this.id
// 	}

// 	protected _config: ConfigType
// 	get config() {
// 		return this._config
// 	}

// 	protected async updateUI() {
// 		const storage = (this.constructor as ResourceConstructor).storage
// 		if (!storage.getById(this.id)) {
// 			//We haven't been injected yet, do not update the UI
// 			return
// 		}
// 		rendererUpdateResource(storage.name, this)
// 	}

// 	async setConfig(config: ConfigType) {
// 		this._config = config
// 		await this.updateUI()
// 		return true
// 	}

// 	async applyConfig(config: Partial<ConfigType>) {
// 		Object.assign(this._config, config)
// 		await this.updateUI()
// 		return true
// 	}

// 	toIPC() {
// 		return {
// 			id: this.id,
// 			config: this.config,
// 			state: _cloneDeep(this.state),
// 		}
// 	}

// 	private _state: StateType
// 	get state() {
// 		return ReactiveGet(this._state, this, "state")
// 	}
// 	set state(newState: StateType) {
// 		this._state = newState
// 		ReactiveSet(this, "state")
// 	}

// 	static async initialize() {
// 		//@ts-ignore
// 		ResourceRegistry.getInstance().register(this)
// 	}

// 	static async uninitialize() {
// 		//@ts-ignore
// 		ResourceRegistry.getInstance().unregister(this)
// 	}
// }

// export function* iterSubResource<T extends ResourceConstructor>(resourceConstructor: T) {
// 	for (const resource of resourceConstructor.storage) {
// 		//TODO: Check parentage
// 		if (resource.constructor == resourceConstructor) {
// 			yield resource as InstanceType<T>
// 		}
// 	}
// }

// export async function removeAllSubResource<T extends ResourceConstructor>(resourceConstructor: T) {
// 	const ids: string[] = []

// 	for (const resource of iterSubResource(resourceConstructor)) {
// 		ids.push(resource.id)
// 	}

// 	await Promise.allSettled(ids.map((id) => resourceConstructor.storage.remove(id)))
// }

export interface ResourceImplementation<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet,
	TCreateArgs extends any[]
> {
	spec: ResourceSpecification<TState, TConfig, TFunctions>
	impl: ResourceImplementationDesc<TState, TConfig, TFunctions, TCreateArgs>
	getById(id: string): Resource<TState, TConfig, TFunctions> | undefined
	removeResources(...ids: string[]): Promise<void>
	[Symbol.iterator](): Generator<Resource<TState, TConfig, TFunctions>>
	create(...args: TCreateArgs): Promise<Resource<TState, TConfig, TFunctions>>
}

export type ResourceType = ResourceImplementation<TSchemaProperties, TSchemaProperties, TSchemaFunctionSet, any[]>

export type ResourceImplementationDesc<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet,
	TCreateArgs extends any[]
> = {
	onDelete?(resource: Resource<TState, TConfig, TFunctions>): MaybePromise<void>
	onCreate?(resource: Resource<TState, TConfig, TFunctions>): MaybePromise<void>
	create(...args: TCreateArgs): Promise<ResourceConstructionData<TState, TConfig>>

	functions: AsyncSchemaFunctionSetType<TFunctions, ResourceData<TState, TConfig, TFunctions>>
}

type Resource<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet,
	TRes = { plugin: string; typeId: string } & ResourceConstructionData<TState, TConfig> &
		AsyncSchemaFunctionSetType<TFunctions>
> = TRes

export function implementResource<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet,
	TCreateArgs extends any[]
>(
	spec: ResourceSpecification<TState, TConfig, TFunctions>,
	impl: ResourceImplementationDesc<TState, TConfig, TFunctions, TCreateArgs>
): ResourceImplementation<TState, TConfig, TFunctions, TCreateArgs> {
	const storage = new Map<string, Resource<TState, TConfig, TFunctions>>()

	const result = {
		spec,
		impl,
		getById(id) {
			return storage.get(id)
		},
		*[Symbol.iterator]() {
			for (const r of storage.values()) {
				yield r
			}
		},
		async removeResources(...ids) {
			for (const id of ids) {
				const r = this.getById(id)
				if (r != null) {
					await impl.onDelete?.(r) //TODO: Error handle
					storage.delete(id)
				}
			}
		},
		async create(...args) {
			const data = await impl.create(...args)
			return {
				...data,
				plugin: spec.plugin,
				typeId: spec.id,
				...impl.functions,
			} as Resource<TState, TConfig, TFunctions>
		},
	} as ResourceImplementation<TState, TConfig, TFunctions, TCreateArgs>

	//@ts-expect-error
	ResourceRegistry.getInstance().registerResource(result)

	return result
}

const TestRes2 = implementResource(testRes, {
	async create(value: string) {
		return {
			id: "blah",
			name: "blarg",
			state: {
				a: 10,
			},
			config: {
				b: "string",
			},
			blah: 10,
		}
	},
	async onDelete(resource) {},
	functions: {
		async testFunc(a, b) {
			return ""
		},
	},
})

const t2 = TestRes2.getById("")

const t3 = await TestRes2.create("BLORG")

t3.testFunc(10, "")

interface ITest {
	a: string
	b: number
}

function testF<T extends ITest>(f: T) {}

testF({
	a: "hello",
	b: 10,
	hello: false,
})
