import _cloneDeep from "lodash/cloneDeep"
import { ipcRenderer, type IpcRendererEvent } from "electron"
import { onMounted, onUnmounted, toRaw } from "vue"
import util from "util"

type IPCFunctor = (...args: any[]) => any

export async function ipcInvoke<ResultT = any>(channel: string, ...args: any[]): Promise<ResultT> {
	//Clone them since ipcRenderer doesn't understand a proxy
	return await ipcRenderer.invoke(channel, ...args.map((arg) => _cloneDeep(arg)))
}

export function useIpcCaller<T extends IPCFunctor>(category: string, event: string) {
	return (...args: Parameters<T>): Promise<ReturnType<T>> => {
		return ipcRenderer.invoke(`${category}_${event}`, ...args.map((arg) => _cloneDeep(arg)))
	}
}

export function handleIpcMessage(
	category: string,
	event: string,
	handler: (event: IpcRendererEvent, ...args: any[]) => any
) {
	ipcRenderer.on(`${category}_${event}`, handler)
}

export function handleIpcRpc(category: string, eventName: string, handler: (...args: any[]) => any) {
	console.log("Setting up", `${category}_${eventName}_call`)
	ipcRenderer.on(`${category}_${eventName}_call`, async (event, id: string, ...args: any[]) => {
		try {
			const result = await handler(...args)

			event.sender.send(`${category}_${eventName}_response`, id, "success", toRaw(result))
			console.log("Responding ", `${category}_${eventName}_response`, id, "success", toRaw(result))
		} catch (err) {
			event.sender.send(`${category}_${eventName}_response`, id, "error", util.inspect(err))
			console.log("Responding", `${category}_${eventName}_response`, id, "error", util.inspect(err))
		}
	})
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
