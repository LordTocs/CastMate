import { ref } from "vue"
import { defineStore } from "pinia"
import { ipcRenderer, type IpcRendererEvent } from "electron"

interface ResourceData {
	id: string
	config: object
	state: object
}

interface ResourceStorage {
	resources: Map<string, ResourceData>
}

export const useResourceStore = defineStore("resources", () => {
	const resourceMap = ref(new Map<string, ResourceStorage>())

	async function initialize() {
		ipcRenderer.on("resources_addResourceType", (event, name: string) => {
			if (resourceMap.value.has(name)) {
				throw new Error("Resource Type Already Exists")
			}

			resourceMap.value.set(name, {
				resources: new Map(),
			})
		})

		ipcRenderer.on("resources_deleteResourceType", (event, name: string) => {
			if (!resourceMap.value.has(name)) {
				throw new Error("Resource type doesn't exist")
			}

			resourceMap.value.delete(name)
		})

		ipcRenderer.on("resources_addResource", (event, type: string, data: ResourceData) => {
			const storage = resourceMap.value.get(type)

			if (!storage) {
				throw new Error("Resource type doesn't exist")
			}

			if (storage.resources.has(data.id)) {
				throw new Error("Resource already exists")
			}

			storage.resources.set(data.id, data)
		})

		ipcRenderer.on("resources_deleteResource", (event, type: string, id: string) => {
			const storage = resourceMap.value.get(type)

			if (!storage) {
				throw new Error("Resource type doesn't exist")
			}

			if (!storage.resources.has(id)) {
				throw new Error("Resource doesn't exist")
			}

			storage.resources.delete(id)
		})

		ipcRenderer.on("resources_updateResource", (event, type: string, data: ResourceData) => {
			const storage = resourceMap.value.get(type)

			if (!storage) {
				throw new Error("Resource type doesn't exist")
			}

			if (!storage.resources.has(data.id)) {
				throw new Error("Resource doesn't exist")
			}

			storage.resources.set(data.id, data)
		})
	}

	return { resourceMap, initialize }
})
