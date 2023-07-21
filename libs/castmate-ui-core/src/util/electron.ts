import { ipcRenderer, type IpcRendererEvent } from "electron"
import { onMounted, onUnmounted } from "vue"

export function useIpcMessage(channel: string, handler: (event: IpcRendererEvent, ...args: any[]) => void) {
	onMounted(() => {
		console.log("Mounted", channel)
		ipcRenderer.on(channel, handler)
	})

	onUnmounted(() => {
		console.log("Unounted", channel)
		ipcRenderer.off(channel, handler)
	})
}
