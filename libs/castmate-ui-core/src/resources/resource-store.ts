import { ref, computed } from "vue"
import { defineStore } from "pinia"
import { handleIpcMessage, useIpcCaller } from "../util/electron"
import { MaybeRefOrGetter, toValue } from "@vueuse/core"
import NameDialog from "../components/dialogs/NameDialog.vue"


interface ResourceData {
	id: string
	config: object
	state: object
}

interface ResourceStorage {
	resources: Map<string, ResourceData>
	creationDialog: any
}

function convertResourcesToStorage(resources: ResourceData[]) {
	const result: ResourceStorage = {
		resources: new Map(),
		creationDialog: NameDialog
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
	const createResource = useIpcCaller<(typeName: string, ...args: any[]) => string>("resources", "createResource")
	const applyResourceConfig = useIpcCaller<(typeName: string, id: string, config: object) => boolean>("resources", "applyConfig")
	const setResourceConfig = useIpcCaller<(typeName: string, id: string, config: object) => boolean>("resources", "setConfig")
	const deleteResource = useIpcCaller<(typeName: string, id: string) => boolean>("resources", "deleteResource")

	async function initialize() {
		handleIpcMessage("resources", "addResourceType", (event, name: string) => {
			if (resourceMap.value.has(name)) {
				throw new Error("Resource Type Already Exists")
			}

			resourceMap.value.set(name, {
				resources: new Map(),
				creationDialog: NameDialog
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
		const resourceArrays = await Promise.all(typeNames.map((tn) => getResources(tn)))

		for (let i = 0; i < typeNames.length; ++i) {
			resourceMap.value.set(typeNames[i], convertResourcesToStorage(resourceArrays[i]))
		}
	}

	return { resourceMap, initialize, createResource, applyResourceConfig, setResourceConfig, deleteResource }
})

export function useResource(typeName: MaybeRefOrGetter<string>) {
	const resourceStore = useResourceStore()

	return computed(() => resourceStore.resourceMap.get(toValue(typeName)))
}
