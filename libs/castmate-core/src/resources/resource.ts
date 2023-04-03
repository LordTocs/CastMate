export interface ResourceStub {
	config: Record<string, any>
	state: Record<string, any>
}

export type Resource = { id: String } & ResourceStub

abstract class ResourceBase {
	id: string
}

function ResourceInit<Input extends new (...args: any) => any>(
	constructor: Input,
	context: ClassDecoratorContext
) {
	context.addInitializer(function () {
		context.name
	})
}

export function ResourceType<T>() {
	class Storage {
		resources: Array<ResourceBase>

		getById(id: String): T {
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

	return @ResourceInit class extends ResourceBase {
		static storage: Storage = new Storage()
	}
}


