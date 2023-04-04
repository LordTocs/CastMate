import { ResourceRegistry } from "./resource-registry"

export interface ResourceBase {
	id: string
}

export interface ResourceStub {
	config: Record<string, any>
	state?: Record<string, any>
}

export type Resource = ResourceBase & ResourceStub

export interface ResourceConstructor<T extends Resource = any> {
	new (...args: any[]): T
	create?(config: object): Promise<T>
	storage: ResourceStorage<T>
}

export interface ResourceStorage<T extends Resource> {
	getById(id: string): T
	[Symbol.iterator](): IterableIterator<T>
	inject(resource: T): void
}

export function RegisterResource<TConstructor extends ResourceConstructor>(
	target: TConstructor,
	context: ClassDecoratorContext<TConstructor>
) {
	context.addInitializer(function () {
		//Any of my metadata work here
		ResourceRegistry.getInstance().register(context.name, target)
	})
}

export function ResourceType<T>() {
	class Storage {
		//Doesn't actually implement ResourceStorage because we can't satisfy extends Resource, we'll just force cast later
		private resources: Array<ResourceBase> = []

		getById(id: string): T {
			return this.resources.find((r) => r.id == id) as T
		}

		*[Symbol.iterator]() {
			for (let r of this.resources) {
				yield r as T
			}
		}

		inject(resource: T) {
			this.resources.push(resource as ResourceBase)
		}
	}

	return class ResourceType implements ResourceBase {
		static storage: Storage = new Storage()
		id: string
	}
}
