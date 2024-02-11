import { DelayedResolver, createDelayedResolver } from "castmate-schema"
import { ipcMain, IpcMainInvokeEvent, WebContents, BrowserWindow } from "electron"
import { nanoid } from "nanoid/non-secure"
import { globalLogger } from "../logging/logging"
import _cloneDeep from "lodash/cloneDeep"

export function defineIPCFunc<T extends (...args: any[]) => any>(category: string, name: string, func: T) {
	ipcMain.handle(`${category}_${name}`, async (event: IpcMainInvokeEvent, ...args: any[]) => {
		try {
			return _cloneDeep(await func(...args))
		} catch (err) {
			globalLogger.error("Error Responding to", `${category}_${name}`)
			globalLogger.error("Args: ", ...args)
			globalLogger.error(err)
			throw err
		}
	})
	return func
}

export function defineCallableIPC<T extends (...args: any[]) => void>(category: string, name: string) {
	const singleFunc = (sender: WebContents, ...args: Parameters<T>) => {
		return sender.send(`${category}_${name}`, ..._cloneDeep(args))
	}

	const broadcast = (...args: Parameters<T>) => {
		for (let window of BrowserWindow.getAllWindows()) {
			try {
				window.webContents.send(`${category}_${name}`, ..._cloneDeep(args))
			} catch (err) {
				globalLogger.error(`Error Sending Broadcast ${category}_${name}`)
				globalLogger.error(`Broadcast Args`, ...args)
				globalLogger.error(err)
			}
		}
	}

	broadcast.sendSingle = singleFunc

	return broadcast
}

export function getMainWindow() {
	const windows = BrowserWindow.getAllWindows()
	if (windows.length == 0) throw new Error("Main Window is missing")
	return windows[0]
}

export function defineIPCRPC<T extends (...args: any[]) => any>(category: string, eventName: string) {
	const rpcMap = new Map<string, DelayedResolver<ReturnType<T>>>()

	const responder = ipcMain.on(
		`${category}_${eventName}_response`,
		(event, id: string, state: "success" | "error", returnValue: ReturnType<T>) => {
			//console.log("Response", `${category}_${eventName}_response`, id, state, returnValue)
			const resolver = rpcMap.get(id)
			if (!resolver) return

			rpcMap.delete(id)
			if (state == "success") {
				resolver.resolve(returnValue)
			} else {
				resolver.reject(returnValue)
			}
		}
	)

	const result = (...args: Parameters<T>) => {
		const mainWindow = getMainWindow()

		const id = nanoid()
		const promise = createDelayedResolver<ReturnType<T>>()

		rpcMap.set(id, promise)
		//console.log("Call", `${category}_${eventName}_call`, id, ...args)
		mainWindow.webContents.send(`${category}_${eventName}_call`, id, ...args)

		return promise.promise
	}

	return result
}
