import {
	SchemaObj,
	Schema,
	SchemaType,
	defineSchema,
	SchemaConstructor,
	squashSchemas,
	SquashedSchemas,
} from "../data/schema"
import { Reactive } from "../reactivity/reactivity"
import { ResourceRegistry } from "./resource-registry"

export interface ResourceBase {
	id: string
}

export interface ResourceStub {
	config: Record<string, any>
	state?: Record<string, any>
}

export type Resource = ResourceBase & ResourceStub

export class ResourceStorage<T extends Resource> {
	//Doesn't actually implement ResourceStorage because we can't satisfy extends Resource, we'll just force cast later
	private resources: Array<T> = []

	getById(id: string) {
		return this.resources.find((r) => r.id == id)
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

interface DerivedResourceConstructor {
	new (...args: any[]): any
	getSpec(): ResourceSpec<any, any>
	load?(): Promise<void>
	registerSuper(): void
}

export interface ResourceConstructor<
	T extends Resource = any,
	ConfigSchema extends SchemaObj = any,
	StateSchema extends SchemaObj = any
> {
	new (...args: any[]): T
	getSpec(): ResourceSpec<ConfigSchema, StateSchema>
	create?(config: object): Promise<T>
	load?(): Promise<void>
	storage: ResourceStorage<T>
}

export function RegisterResource<TConstructor extends ResourceConstructor>(
	target: TConstructor,
	context: ClassDecoratorContext<TConstructor>
) {
	context.addInitializer(function () {
		//Any of my metadata work here
		if (context.name != null) {
			ResourceRegistry.getInstance().register(context.name, target)
		} else {
			throw new Error("Resources cannot be anonymous")
		}
	})
}

export function ExtractStorageAny<TConstructor extends new (...args: any[]) => any>(constructor: TConstructor) {
	const resourceConstructor = constructor as unknown as ResourceConstructor<any>
	return resourceConstructor.storage
}

export interface ResourceSpec<ConfigSchema extends SchemaObj, StateSchema extends SchemaObj> {
	config: ConfigSchema
	state: StateSchema
}

export function defineResource<ConfigSchema extends SchemaObj, StateSchema extends SchemaObj>(
	spec: ResourceSpec<ConfigSchema, StateSchema>
) {
	return class ResourceType {
		readonly id: string

		//Config

		private _config: SchemaType<ConfigSchema>
		get config(): SchemaType<ConfigSchema> {
			return this._config
		}

		async setConfig(config: SchemaType<ConfigSchema>) {
			this._config = config
			//TODO: Send to UI
		}

		constructor(id: string, config: SchemaType<ConfigSchema>) {
			this.id = id
			this._config = config
		}

		//State

		@Reactive
		accessor state: SchemaType<StateSchema>

		//MetaData

		static getSpec() {
			return spec
		}

		private static _derivedResourceConstructors: DerivedResourceConstructor[] = []

		static registerDerivedResource(constructor: DerivedResourceConstructor) {
			this._derivedResourceConstructors.push(constructor)
		}

		static async loadDerived() {
			return await Promise.all(this._derivedResourceConstructors.map((dc) => dc.load?.()))
		}
	}
}

export type ResourceConfig<T extends Resource> = T["config"]
export type ResourceState<T extends Resource> = T["state"]

interface ResourceSchemaInferConstructor<ConfigSchema extends SchemaObj = any, StateSchema extends SchemaObj = any> {
	new (...args: any[]): any
	getSpec(): ResourceSpec<ConfigSchema, StateSchema>
	registerDerivedResource(constructor: DerivedResourceConstructor): void
}

export function ExtendedResource<TConstructor extends DerivedResourceConstructor>(
	constructor: TConstructor,
	context: ClassDecoratorContext
) {
	context.addInitializer(function () {
		constructor.registerSuper()
	})
}

export function extendResource<
	ConfigSchema extends SchemaObj,
	StateSchema extends SchemaObj,
	BaseConfigSchema extends SchemaObj,
	BaseStateSchema extends SchemaObj,
	BaseConstructor extends ResourceSchemaInferConstructor<BaseConfigSchema, BaseStateSchema>
>(spec: ResourceSpec<ConfigSchema, StateSchema>, baseResourceConstructor: BaseConstructor) {
	const combinedSpec = {
		config: squashSchemas(baseResourceConstructor.getSpec().config, spec.config),
		state: squashSchemas(baseResourceConstructor.getSpec().state, spec.state),
	}

	return class ExtendedResource extends baseResourceConstructor {
		config: SchemaType<typeof combinedSpec.config>

		@Reactive
		accessor state: SchemaType<typeof combinedSpec.state>

		static getSpec(): ResourceSpec<typeof combinedSpec.config, typeof combinedSpec.state> {
			return combinedSpec
		}

		static registerSuper() {
			super.registerDerivedResource(this)
		}
	}
}

export function serializeToIPC<R extends Resource, T extends ResourceConstructor<R>>(rConstructor: T) {
	rConstructor.getSpec().config
}
