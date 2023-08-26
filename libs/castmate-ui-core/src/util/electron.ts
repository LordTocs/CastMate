import _cloneDeep from "lodash/cloneDeep"
import { ipcRenderer, type IpcRendererEvent } from "electron"
import { onMounted, onUnmounted } from "vue"

type IPCFunctor = (...args: any[]) => any

export async function ipcInvoke<ResultT = any>(channel: string, ...args: any[]): Promise<ResultT> {
	//Clone them since ipcRenderer doesn't understand a proxy
	return await ipcRenderer.invoke(channel, ...args.map((arg) => _cloneDeep(arg)))
}

export function useIpcCaller<T extends IPCFunctor>(category: string, event: string) {
	return (...args: Parameters<T>): Promise<ReturnType<T>> => {
		return ipcRenderer.invoke(`${category}_${event}`, ...args)
	}
}

export function handleIpcMessage(
	category: string,
	event: string,
	handler: (event: IpcRendererEvent, ...args: any[]) => any
) {
	ipcRenderer.on(`${category}_${event}`, handler)
}

export function useIpcMessage(
	category: string,
	event: string,
	handler: (event: IpcRendererEvent, ...args: any[]) => void
) {
	const channel = `${category}_${event}`
	onMounted(() => {
		console.log("Mounted", channel)
		ipcRenderer.on(channel, handler)
	})

	onUnmounted(() => {
		console.log("Unounted", channel)
		ipcRenderer.off(channel, handler)
	})
}
