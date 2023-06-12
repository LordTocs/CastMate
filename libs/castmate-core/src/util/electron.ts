import { ipcMain, IpcMainInvokeEvent, WebContents, BrowserWindow } from "electron"

export function defineIPCFunc<T extends (...args: any[]) => any>(category: string, name: string, func: T) {
	ipcMain.handle(`${category}_${name}`, async (event: IpcMainInvokeEvent, ...args: any[]) => {
		return await func(...args)
	})
	return func
}

type IPCFunctor = (...args: any[]) => void
type ExtractArgs<T extends IPCFunctor> = T extends (...args: infer Args) => void ? Args : never

export function defineCallableIPC<T extends (...args: any[]) => void>(category: string, name: string) {
	const singleFunc = (sender: WebContents, ...args: ExtractArgs<T>) => {
		return sender.send(`${category}_${name}`, ...args)
	}

	const broadcast = (...args: ExtractArgs<T>) => {
		for (let window of BrowserWindow.getAllWindows()) {
			window.webContents.send(`${category}_${name}`, ...args)
		}
	}

	broadcast.sendSingle = singleFunc

	return broadcast
}
