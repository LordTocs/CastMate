import { globalLogger, usePluginLogger } from "../logging/logging"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { Service } from "../util/service"
import { Resource, ResourceBase, ResourceStorage, ResourceConstructor } from "./resource"

interface ResourceEntry<T extends ResourceBase = any> {
	typeName: string
	constructor: ResourceConstructor<T>
	storage: ResourceStorage<T>
	ipcFuncs: string[]
}

export async function createResource<T extends ResourceBase>(constructor: ResourceConstructor<T>, ...args: any[]) {
	let result: T

	if (constructor.create) {
		result = await constructor.create(...args)
	} else {
		result = new constructor(...args)
	}

	constructor.onCreate?.(result)

	constructor.storage.inject(result)

	return result
}

defineIPCFunc("resources", "getResourceTypeNames", () => {
	return ResourceRegistry.getInstance().resourceTypeNames
})

defineIPCFunc("resources", "getResources", (typeName: string) => {
	const type = ResourceRegistry.getInstance().getResourceType(typeName)

	const result = []

	for (let r of type.storage) {
		result.push(r.toIPC())
	}

	return result
})

defineIPCFunc("resources", "setConfig", async (type: string, id: string, config: object) => {
	const resourceType = ResourceRegistry.getInstance().getResourceType(type)

	if (!resourceType) {
		throw new Error("Resource Type doesn't exist")
	}

	const resource = resourceType.storage.getById(id)

	if (!resource) {
		throw new Error("Resource doesn't exist")
	}

	//resource.config = config
	return await resource.setConfig(config)
})

defineIPCFunc("resources", "applyConfig", async (type: string, id: string, config: object) => {
	const resourceType = ResourceRegistry.getInstance().getResourceType(type)

	if (!resourceType) {
		throw new Error("Resource Type doesn't exist")
	}

	const resource = resourceType.storage.getById(id)

	if (!resource) {
		throw new Error("Resource doesn't exist")
	}

	//resource.config = config
	return await resource.applyConfig(config)
})

defineIPCFunc("resources", "createResource", async (type: string, ...args: any[]) => {
	const resource = await ResourceRegistry.getInstance().create(type, ...args)
	return resource?.id
})

defineIPCFunc("resources", "deleteResource", async (type: string, id: string) => {
	const resourceType = await ResourceRegistry.getInstance().getResourceType(type)
	if (!resourceType) return

	await resourceType.storage.remove(id)
})

type CallableResource = Record<string, (...args: any[]) => any>
defineIPCFunc("resources", "callIPCMember", async (type: string, id: string, func: string, ...args: any[]) => {
	const resourceType = await ResourceRegistry.getInstance().getResourceType(type)
	if (!resourceType) throw new Error(`Missing Resource Type ${type}`)

	const resource = resourceType.storage.getById(id)
	if (!resource) throw new Error(`Missing Resource ${id} from ${type}`)

	if (!resourceType.ipcFuncs.includes(func))
		throw new Error(`Resource type ${type} does not include an IPC func ${func}`)

	//@ts-ignore SHUT UP THIS WORKS
	return await (resource as CallableResource)[func](...args)
})

const rendererAddResourceType = defineCallableIPC<(name: string) => void>("resources", "addResourceType")
const rendererDeleteResourceType = defineCallableIPC<(name: string) => void>("resources", "deleteResourceType")

export const ResourceRegistry = Service(
	class {
		private resourceTypes: ResourceEntry[] = []

		get resourceTypeNames() {
			return this.resourceTypes.map((rt) => rt.typeName)
		}

		//Don't extends Resource here because the metadata function can't recursively satisfy it.
		register<T extends ResourceBase>(constructor: ResourceConstructor<T>) {
			const logger = usePluginLogger("resources")
			if (!constructor.storage) {
				logger.error("Cannot Register Resource", constructor)
				return
			}
			logger.log("Registering Resource", constructor.storage.name)

			this.resourceTypes.push({
				typeName: constructor.storage.name,
				constructor,
				storage: constructor.storage,
				ipcFuncs: [],
			})

			rendererAddResourceType(constructor.storage.name)
		}

		unregister<T extends ResourceBase>(constructor: ResourceConstructor<T>) {
			const logger = usePluginLogger("resources")
			logger.log("Unregistering Resource")

			const idx = this.resourceTypes.findIndex((rt) => rt.constructor == constructor)

			if (idx < 0) {
				//TODO: Error?
				return
			}

			this.resourceTypes.splice(idx, 1)

			rendererDeleteResourceType(constructor.storage.name)
		}

		exposeIPCFunction<T extends ResourceBase>(constructor: ResourceConstructor<T>, name: keyof T) {
			const resourceType = this.getResourceType(constructor.storage.name)
			if (!resourceType) return
			resourceType.ipcFuncs.push(name as string)
		}

		getResourceType<T extends ResourceBase>(typeName: string) {
			return this.resourceTypes.find((rt) => rt.typeName == typeName) as ResourceEntry<T>
		}

		async create<T extends ResourceBase>(typeName: string, ...args: any[]) {
			const entry = this.getResourceType<T>(typeName)
			if (!entry) {
				return undefined
			}

			const result = await createResource(entry.constructor, ...args)

			entry.storage.inject(result)

			return result
		}
	}
)
