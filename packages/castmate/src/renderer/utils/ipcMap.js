import { ipcRenderer } from "electron"
import _cloneDeep from "lodash/cloneDeep"
import { unref } from "vue"

export function mapIpcs(pluginName, functions) {
	let result = {}
	for (let ipcMethod of functions) {
		result[ipcMethod] = async function (...args) {
			//Do we really have to clone? It appears ipcRenderer.invoke does not understand what a Proxy is.
			return await ipcRenderer.invoke(
				`${pluginName}_${ipcMethod}`,
				...args.map((a) => _cloneDeep(a))
			)
		}
	}
	return result
}

export function useIpc(pluginName, ipcMethod) {
	return async function (...args) {
		return await ipcRenderer.invoke(
			`${unref(pluginName)}_${unref(ipcMethod)}`,
			...args.map((a) => _cloneDeep(a))
		)
	}
}
