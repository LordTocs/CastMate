import { getFonts } from "font-list"
import { ipcFunc, mainWindow } from "./electronBridge.js"
import logger from "./logger.js"
import thumbsupply from "thumbsupply"
import { app, dialog } from "./electronBridge.js"
import path from "path"
import os from "os"

export function osInit() {
	logger.info("Initing OS Util Funcs")

	ipcFunc("os", "getFonts", async () => {
		return await getFonts({ disableQuoting: true })
	})

	ipcFunc("media", "getThumbnail", async (videoFile) => {
		try {
			const thumbnail = await thumbsupply.generateThumbnail(videoFile, {
				size: thumbsupply.ThumbSize.MEDIUM,
				timestamp: "10%",
				cacheDir: app.getPath("temp"),
			})

			return thumbnail
		} catch (err) {
			return null
		}
	})

	ipcFunc("os", "selectDir", async (existing) => {
		const result = await dialog.showOpenDialog(mainWindow, {
			properties: ["openDirectory"],
			defaultPath: existing,
		})

		return result?.filePaths?.[0]
	})

	ipcFunc("os", "selectFile", async (filters, existing) => {
		const result = await dialog.showOpenDialog(mainWindow, {
			properties: ["openFile"],
			defaultPath: existing,
			filters,
		})

		return result.filePaths?.[0]
	})
}

export function getLocalIP() {
	const interfaces = os.networkInterfaces()
	for (let interfaceKeys of Object.keys(interfaces)) {
		for (let net of interfaces[interfaceKeys]) {
			const familyV4Value = typeof net.family === "string" ? "IPv4" : 4
			if (net.family === familyV4Value && !net.internal) {
				return net.address
			}
		}
	}
}
