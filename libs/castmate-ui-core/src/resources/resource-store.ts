import { ref } from "vue"
import { defineStore } from "pinia"
import { handleIpcMessage, useIpcCaller } from "../util/electron"

interface ResourceData {
	id: string
	config: object
	state: object
}

interface ResourceStorage {
	resources: Map<string, ResourceData>
}

function convertResourcesToStorage(resources: ResourceData[]) {
	const result : ResourceStorage = {
		resources: new Map()
	}

	for (let r of resources) {
		result.resources.set(r.id, r)
	}

	return result
}

export const useResourceStore = defineStore("resources", () => {
	const resourceMap = ref(new Map<string, ResourceStorage>())

	const getResourceTypeNames = useIpcCaller<() => string[]>("resources", "getResourceTypeNames")
	const getResources = useIpcCaller<(typeName: string) => ResourceData[]>("resources", "getResources")

	async function initialize() {
		handleIpcMessage("resources", "addResourceType", (event, name: string) => {
			if (resourceMap.value.has(name)) {
				throw new Error("Resource Type Already Exists")
			}

			resourceMap.value.set(name, {
				resources: new Map(),
			})
		})

		handleIpcMessage("resources", "deleteResourceType", (event, name: string) => {
			if (!resourceMap.value.has(name)) {
				throw new Error("Resource type doesn't exist")
			}

			resourceMap.value.delete(name)
		})

		handleIpcMessage("resources", "addResource", (event, type: string, data: ResourceData) => {
			const storage = resourceMap.value.get(type)

			if (!storage) {
				throw new Error("Resource type doesn't exist")
			}

			if (storage.resources.has(data.id)) {
				throw new Error("Resource already exists")
			}

			storage.resources.set(data.id, data)
		})

		handleIpcMessage("resources", "deleteResource", (event, type: string, id: string) => {
			const storage = resourceMap.value.get(type)

			if (!storage) {
				throw new Error("Resource type doesn't exist")
			}

			if (!storage.resources.has(id)) {
				throw new Error("Resource doesn't exist")
			}

			storage.resources.delete(id)
		})

		handleIpcMessage("resources", "updateResource", (event, type: string, data: ResourceData) => {
			const storage = resourceMap.value.get(type)

			if (!storage) {
				throw new Error("Resource type doesn't exist")
			}

			if (!storage.resources.has(data.id)) {
				throw new Error("Resource doesn't exist")
			}

			storage.resources.set(data.id, data)
		})

		const typeNames = await getResourceTypeNames()
		const resourceArrays = await Promise.all(typeNames.map(tn => getResources(tn)))

		for (let i = 0; i < typeNames.length; ++i) {
			resourceMap.value.set(typeNames[i], convertResourcesToStorage(resourceArrays[i]))
		}
	}

	return { resourceMap, initialize }
})