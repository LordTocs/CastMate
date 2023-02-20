import { ipcRenderer } from "electron"
import { computed } from "vue"
import { useResourceStore } from "../store/resources"
import _cloneDeep from "lodash/cloneDeep"
export function useResourceArray(resourceType) {
	const resourceStore = useResourceStore()
	return computed(() => {
		return resourceStore.resources[resourceType]
	})
}

export function useResourceType(resourceType) {
	const resourceStore = useResourceStore()
	return computed(() => {
		return resourceStore.types.find((t) => t.type == resourceType)
	})
}

function capitalizeType(typename) {
	return typename.charAt(0).toUpperCase() + typename.slice(1)
}

export function mapResourceFunctions(resourceType) {
	const capTypeName = capitalizeType(resourceType)
	return {
		[`get${capTypeName}ById`]: async function (id) {
			return await ipcRenderer.invoke(
				`resources_${resourceType}_getById`,
				id
			)
		},
		[`create${capTypeName}`]: async function (config) {
			return await ipcRenderer.invoke(
				`resources_${resourceType}_create`,
				config
			)
		},
		[`set${capTypeName}Config`]: async function (id, config) {
			return await ipcRenderer.invoke(
				`resources_${resourceType}_setConfig`,
				id,
				config
			)
		},
		[`delete${capTypeName}`]: async function (id) {
			return await ipcRenderer.invoke(
				`resources_${resourceType}_delete`,
				id
			)
		},
		[`clone${capTypeName}`]: async function (id) {
			return await ipcRenderer.invoke(
				`resources_${resourceType}_clone`,
				id
			)
		},
	}
}

export function useResourceFunctions(resourceType) {
	return {
		[`getById`]: async function (id) {
			return await ipcRenderer.invoke(
				`resources_${resourceType}_getById`,
				id
			)
		},
		[`create`]: async function (config) {
			return await ipcRenderer.invoke(
				`resources_${resourceType}_create`,
				_cloneDeep(config)
			)
		},
		[`setConfig`]: async function (id, config) {
			return await ipcRenderer.invoke(
				`resources_${resourceType}_setConfig`,
				id,
				_cloneDeep(config)
			)
		},
		[`delete`]: async function (id) {
			return await ipcRenderer.invoke(
				`resources_${resourceType}_delete`,
				id
			)
		},
		[`clone`]: async function (id) {
			return await ipcRenderer.invoke(
				`resources_${resourceType}_clone`,
				id
			)
		},
	}
}
