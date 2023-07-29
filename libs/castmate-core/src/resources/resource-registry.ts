import { Service } from "../util/service"
import { Resource, ResourceBase, ResourceStorage, ResourceConstructor } from "./resource"

interface ResourceEntry<T extends ResourceBase = any> {
	typeName: string
	constructor: ResourceConstructor<T>
	storage: ResourceStorage<T>
}

export async function createResource<T extends ResourceBase>(constructor: ResourceConstructor<T>, config: object) {
	let result: T
	if (constructor.create) {
		result = await constructor.create(config)
	} else {
		result = new constructor(config)
	}

	constructor.storage.inject(result)

	return result
}

export const ResourceRegistry = Service(
	class {
		private resourceTypes: ResourceEntry[] = []

		//Don't extends Resource here because the metadata function can't recursively satisfy it.
		register<T extends ResourceBase>(name: string, constructor: ResourceConstructor<T>) {
			console.log("Registering Resource", name, constructor.storage)

			this.resourceTypes.push({
				typeName: name,
				constructor,
				storage: constructor.storage,
			})
		}

		unregister<T extends ResourceBase>(constructor: ResourceConstructor<T>) {
			console.log("Unregistering Resource")

			const idx = this.resourceTypes.findIndex((rt) => rt.constructor == constructor)

			if (idx < 0) {
				//TODO: Error?
				return
			}

			this.resourceTypes.splice(idx, 1)
		}

		getResourceType<T extends ResourceBase>(typeName: string) {
			return this.resourceTypes.find((rt) => rt.typeName == typeName) as ResourceEntry<T>
		}

		async create<T extends ResourceBase>(typeName: string, ...args: any[]) {
			const entry = this.getResourceType<T>(typeName)
			if (!entry) {
				return undefined
			}

			const result = await createResource(entry.constructor, {})

			entry.storage.inject(result)

			return result
		}
	}
)
