import { ref, computed, Component, markRaw } from "vue"
import { defineStore } from "pinia"
import { handleIpcMessage, useIpcCaller } from "../util/electron"
import { MaybeRefOrGetter, toValue } from "@vueuse/core"
import { ResourceData } from "castmate-schema"

interface ResourceStorage<TResourceData extends ResourceData = ResourceData> {
	resources: Map<string, TResourceData>
	selectorItemComponent?: Component
	viewComponent?: Component
	settingComponent?: Component
	createDialog?: Component
	editDialog?: Component
}

function convertResourcesToStorage(resources: ResourceData[]) {
	const result: ResourceStorage = {
		resources: new Map(),
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
	const applyResourceConfig = useIpcCaller<(typeName: string, id: string, config: object) => boolean>(
		"resources",
		"applyConfig"
	)
	const setResourceConfig = useIpcCaller<(typeName: string, id: string, config: object) => boolean>(
		"resources",
		"setConfig"
	)
	const deleteResource = useIpcCaller<(typeName: string, id: string) => boolean>("resources", "deleteResource")

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
		const resourceArrays = await Promise.all(typeNames.map((tn) => getResources(tn)))

		for (let i = 0; i < typeNames.length; ++i) {
			resourceMap.value.set(typeNames[i], convertResourcesToStorage(resourceArrays[i]))
		}
	}

	function registerSettingComponent(resourceId: string, component: Component) {
		const resource = resourceMap.value.get(resourceId)
		if (!resource) return
		resource.settingComponent = markRaw(component)
	}

	return {
		resourceMap,
		initialize,
		createResource,
		applyResourceConfig,
		setResourceConfig,
		deleteResource,
		registerSettingComponent,
	}
})

export function useResources<TResourceData extends ResourceData = ResourceData>(typeName: MaybeRefOrGetter<string>) {
	const resourceStore = useResourceStore()

	return computed(() => resourceStore.resourceMap.get(toValue(typeName)) as ResourceStorage<TResourceData>)
}

export function useResource<TResourceData extends ResourceData>(
	typeName: MaybeRefOrGetter<string>,
	id: MaybeRefOrGetter<string>
) {
	const resourceStore = useResourceStore()

	return computed(() => resourceStore.resourceMap.get(toValue(typeName))?.resources.get(toValue(id)) as TResourceData)
}

export function useResourceIPCCaller<TFunc extends (...args: any) => any>(
	typeName: MaybeRefOrGetter<string>,
	id: MaybeRefOrGetter<string>,
	funcName: MaybeRefOrGetter<string>
) {
	const memberInvoker = useIpcCaller<
		(type: string, id: string, func: string, ...args: Parameters<TFunc>) => ReturnType<TFunc>
	>("resources", "callIPCMember")

	return async (...args: Parameters<TFunc>) => {
		return await memberInvoker(toValue(typeName), toValue(id), toValue(funcName), ...args)
	}
}
