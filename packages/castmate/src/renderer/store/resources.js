import { ipcRenderer } from "electron"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { useIpc } from "../utils/ipcMap"

export const useResourceStore = defineStore("resources", () => {
	const resourceTypes = ref([])
	const resourcesStorage = ref({})

	const getResourceTypes = useIpc("resourceManager", "getResourceTypes")

	async function init() {
		console.log("Initting Resource Store")

		ipcRenderer.on(
			"resources_updateResourceArray",
			(event, type, resourceArray) => {
				resources.value[type] = resourceArray
				//console.log("Update Resource Array", type, resourceArray)
			}
		)

		ipcRenderer.on(
			"resources_updateResource",
			(event, type, id, newValue) => {
				const resourceArray = resources.value[type]

				const idx = resourceArray.findIndex((r) => r.id == id)
				if (idx != -1) {
					resourceArray[idx] = newValue
				}
			}
		)

		ipcRenderer.on(
			"resources_updateResourceState",
			(event, type, id, key, value) => {
				const resourceArray = resources.value[type]

				if (!resourceArray) {
					console.error(
						"Updating resource state before the array exists!"
					)
					return
				}

				const idx = resourceArray.findIndex((r) => r.id == id)
				if (idx != -1) {
					resourceArray[idx].state[key] = value
				}
			}
		)

		resourceTypes.value = await getResourceTypes()

		const resourceArrays = await Promise.all(
			resourceTypes.value.map(async (rt) => ({
				type: rt.type,
				resources: await ipcRenderer.invoke(`resources_${rt.type}_get`),
			}))
		)

		for (let ra of resourceArrays) {
			resourcesStorage.value[ra.type] = ra.resources
		}
	}

	const resources = computed(() => resourcesStorage.value)
	const types = computed(() => resourceTypes.value)

	return { init, resources, types }
})
