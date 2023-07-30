//import { fileURLToPath } from "node:url"
//import { createRequire } from "node:module"
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer"
//import electronUpdater from "electron-updater"
import { app, BrowserWindow, ipcMain } from "electron"
import { createWindow } from "./electron/electron-helpers"
import { initializeCastMate } from "castmate-core"
import { loadPlugins } from "./plugins"

const isDevelopment = true //TODO: import.meta.env.DEV

if (process.platform === "win32") app.setAppUserModelId(app.getName())

//???
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true"

function quit() {
	app.quit()
	process.exit(0)
}

function createMainWindow() {
	const win = createWindow("index.html", 1600, 900)

	win.on("close", () => {
		//Workaround for electron bug.
		if (win.webContents.isDevToolsOpened()) {
			win.webContents.closeDevTools()
		}
	})

	win.on("closed", () => {
		quit()
	})
}

app.whenReady().then(async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		try {
			await installExtension(VUEJS_DEVTOOLS)
		} catch {}
	}

	console.log("Win Ready!")
	await createMainWindow()

	await initializeCastMate()

	await loadPlugins()

	//initCastMate(mainWindow)

	//autoUpdater.checkForUpdatesAndNotify();
	//doUpdateCheck()
})

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		quit()
	}
})

app.on("activate", () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
	if (process.platform === "win32") {
		process.on("message", (data) => {
			if (data === "graceful-exit") {
				console.log("Graceful Exit")
				quit()
			}
		})
	} else {
		process.on("SIGTERM", () => {
			quit()
		})
	}
}
