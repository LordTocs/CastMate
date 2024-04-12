import _cloneDeep from "lodash/cloneDeep"
import { ref, computed, Component, markRaw } from "vue"
import { defineStore } from "pinia"
import { handleIpcMessage, useIpcCaller } from "../util/electron"
import { MaybeRefOrGetter, toValue } from "@vueuse/core"
import { ResourceData, Schema } from "castmate-schema"
import { useDialog } from "primevue/usedialog"
import { useConfirm } from "primevue/useconfirm"
import ResourceEditDialogVue from "../components/resources/ResourceEditDialog.vue"

interface ResourceStorage<TResourceData extends ResourceData = ResourceData> {
	resources: Map<string, TResourceData>
	selectorItemComponent?: Component
	configGroupPath?: string
	selectorGroupHeaderComponent?: Component
	selectSort?: (a: TResourceData, b: TResourceData) => number
	viewComponent?: Component
	settingComponent?: Component
	createDialog?: Component
	editDialog?: Component
	editSaveFunction?: (id: string, data: TResourceData["config"]) => any
	configSchema?: Schema
	stateSchema?: Schema
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
				return
			}

			if (!storage.resources.has(data.id)) {
				return
			}

			storage.resources.set(data.id, data)
		})

		const typeNames = await getResourceTypeNames()
		const resourceArrays = await Promise.all(typeNames.map((tn) => getResources(tn)))

		for (let i = 0; i < typeNames.length; ++i) {
			resourceMap.value.set(typeNames[i], convertResourcesToStorage(resourceArrays[i]))
		}
	}

	function registerSettingComponent(resourceType: string, component: Component) {
		const resource = resourceMap.value.get(resourceType)
		if (!resource) return
		resource.settingComponent = markRaw(component)
	}

	function registerEditComponent(
		resourceType: string,
		component: Component,
		saveFunc?: (id: string, data: any) => any
	) {
		const resource = resourceMap.value.get(resourceType)
		if (!resource) return
		resource.editDialog = markRaw(component)
		resource.editSaveFunction = saveFunc
	}

	function registerCreateComponent(resourceType: string, component: Component) {
		const resource = resourceMap.value.get(resourceType)
		if (!resource) return
		resource.createDialog = markRaw(component)
	}

	function registerConfigSchema<T extends Schema>(resourceType: string, schema: T) {
		const resource = resourceMap.value.get(resourceType)
		if (!resource) return
		resource.configSchema = markRaw(schema)
	}

	function registerStateSchema<T extends Schema>(resourceType: string, schema: T) {
		const resource = resourceMap.value.get(resourceType)
		if (!resource) return
		resource.stateSchema = markRaw(schema)
	}

	function groupResourceItems(resourceType: string, configPath: string, groupHeader?: Component) {
		const resource = resourceMap.value.get(resourceType)
		if (!resource) return

		resource.configGroupPath = configPath
		resource.selectorGroupHeaderComponent = groupHeader
	}

	function sortResourceItems<T extends ResourceData>(resourceType: string, sortFunc: (a: T, b: T) => number) {
		const resource = resourceMap.value.get(resourceType)
		if (!resource) return

		resource.selectSort = sortFunc as (a: ResourceData, b: ResourceData) => number
	}

	return {
		resourceMap,
		initialize,
		createResource,
		applyResourceConfig,
		setResourceConfig,
		deleteResource,
		registerSettingComponent,
		registerEditComponent,
		registerCreateComponent,
		registerConfigSchema,
		registerStateSchema,
		groupResourceItems,
		sortResourceItems,
	}
})

export function useResourceData<TResourceData extends ResourceData = ResourceData>(
	resourceType: MaybeRefOrGetter<string | undefined>
) {
	const resourceStore = useResourceStore()

	return computed(() => {
		const typeName = toValue(resourceType)
		if (!typeName) return undefined
		return resourceStore.resourceMap.get(typeName) as ResourceStorage<TResourceData> | undefined
	})
}

export function useResourceArray<TResourceData extends ResourceData = ResourceData>(
	resourceType: MaybeRefOrGetter<string | undefined>
) {
	const resourceStore = useResourceStore()
	return computed(() => {
		const typeName = toValue(resourceType)
		if (!typeName) return []
		const resourceData = resourceStore.resourceMap.get(typeName) as ResourceStorage<TResourceData> | undefined
		if (!resourceData) return []
		return [...resourceData.resources.values()]
	})
}

export function useResource<TResourceData extends ResourceData>(
	typeName: MaybeRefOrGetter<string>,
	id: MaybeRefOrGetter<string | undefined>
) {
	const resourceStore = useResourceStore()

	return computed(() => {
		const resourceId = toValue(id)
		if (!resourceId) return undefined
		return resourceStore.resourceMap.get(toValue(typeName))?.resources.get(resourceId) as TResourceData
	})
}

export function useResourceCreateDialog(resourceType: MaybeRefOrGetter<string | undefined>) {
	const resourceStore = useResourceStore()
	const dialog = useDialog()

	function open() {
		const resourceName = toValue(resourceType)
		if (!resourceName) return
		const resource = resourceStore.resourceMap.get(resourceName)

		dialog.open(ResourceEditDialogVue, {
			props: {
				header: `Create ${resourceName}`,
				style: {
					width: "40vw",
				},
				modal: true,
			},
			data: {
				resourceType: resourceName,
			},
			onClose(options) {
				if (!options?.data) {
					return
				}

				resourceStore.createResource(resourceName, options.data)
			},
		})
	}

	return open
}

export function useResourceEditDialog(resourceType: MaybeRefOrGetter<string | undefined>) {
	const resourceStore = useResourceStore()
	const dialog = useDialog()

	return function open(id: string) {
		const resourceName = toValue(resourceType)
		if (!resourceName) return
		const resourceData = resourceStore.resourceMap.get(resourceName)
		const resource = resourceData?.resources?.get(id)
		if (!resource) return

		dialog.open(ResourceEditDialogVue, {
			props: {
				header: `Create ${resourceName}`,
				style: {
					width: "40vw",
				},
				modal: true,
			},
			data: {
				resourceType: resourceName,
				resourceId: id,
				initialConfig: _cloneDeep(resource.config),
			},
			onClose(options) {
				if (!options?.data) {
					return
				}

				if (resourceData?.editSaveFunction) {
					resourceData.editSaveFunction(id, options.data)
				} else {
					resourceStore.setResourceConfig(resourceName, id, options.data)
				}
			},
		})
	}
}

export function useResourceDeleteDialog(resourceType: MaybeRefOrGetter<string | undefined>) {
	const resourceStore = useResourceStore()
	const confirm = useConfirm()

	return function (id: string) {
		const resourceTypeName = toValue(resourceType)
		if (!resourceTypeName) return
		const resource = resourceStore.resourceMap.get(resourceTypeName)?.resources?.get(id)
		if (!resource) return
		confirm.require({
			header: `Delete ${resource.config.name}`,
			message: `Are you sure you want to delete ${resource.config.name}`,
			icon: "mdi mdi-delete",
			accept() {
				resourceStore.deleteResource(resourceTypeName, id)
			},
			reject() {},
		})
	}
}

export function useResourceIPCCaller<TFunc extends (...args: any) => any>(
	typeName: MaybeRefOrGetter<string>,
	id: MaybeRefOrGetter<string | undefined>,
	funcName: MaybeRefOrGetter<string>
) {
	const memberInvoker = useIpcCaller<
		(type: string, id: string, func: string, ...args: Parameters<TFunc>) => ReturnType<TFunc>
	>("resources", "callIPCMember")

	return async (...args: Parameters<TFunc>) => {
		const idValue = toValue(id)

		if (!idValue) throw new Error("Missing ID!")

		return await memberInvoker(toValue(typeName), idValue, toValue(funcName), ...args)
	}
}
