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
