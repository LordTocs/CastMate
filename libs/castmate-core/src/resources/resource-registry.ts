import { Service } from "../util/service"
import { Resource, ResourceStorage, ResourceConstructor } from "./resource"

interface ResourceEntry<T extends Resource = any> {
	typeName: string
	constructor: ResourceConstructor<T>
	storage: ResourceStorage<T>
}

export async function createResource<T extends Resource>(
	constructor: ResourceConstructor<T>,
	config: object
) {
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
		register<T extends Resource>(
			name: string,
			constructor: ResourceConstructor<T>
		) {
			console.log("Registering Resource", name, constructor.storage)

			this.resourceTypes.push({
				typeName: name,
				constructor,
				storage: constructor.storage,
			})
		}

		getResourceType<T extends Resource>(typeName: string) {
			return this.resourceTypes.find(
				(rt) => rt.typeName == typeName
			) as ResourceEntry<T>
		}

		async create<T extends Resource>(typeName: string, ...args: any[]) {
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
