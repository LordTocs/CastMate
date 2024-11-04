//import { fileURLToPath } from "node:url"
//import { createRequire } from "node:module"
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer"
//import electronUpdater from "electron-updater"
import { app, BrowserWindow, ipcMain, contentTracing } from "electron"
import { createWindow } from "./electron/electron-helpers"
import { initializeCastMate, finializeCastMateSetup, loadAutomations, setupCastMateDirectories } from "castmate-core"
import { finishInitDashboards } from "castmate-plugin-dashboards-main"
import { loadPlugins } from "./plugins"
import { checkMigration, finishMigration, migrateAllOldAutomations } from "./migration/old-migration"

const isDevelopment = !app.isPackaged // true //TODO: import.meta.env.DEV

if (process.platform === "win32") app.setAppUserModelId(app.getName())

//???
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true"

function quit() {
	app.quit()
	process.exit(0)
}

function createMainWindow() {
	const portable = process.env.PORTABLE_EXECUTABLE_FILE != null || process.argv.includes("--portable")
	const win = createWindow("index.html", 1600, 900, { portable: String(portable), dev: String(isDevelopment) })

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
	/*
	//Uncomment this block if you want to take a trace to view in chrome://tracing
	//Keep the time short else it will fail to open
	setTimeout(async () => {
		console.log("Starting Trace")
		await contentTracing.startRecording({
			included_categories: ["*"],
		})

		setTimeout(async () => {
			console.log("Stopping Trace!")
			const path = await contentTracing.stopRecording("./trace.json")
			console.log("Stopped Trace", path)
		}, 2 * 1000)
	}, 60 * 1000)*/

	//Setup our user folder location / session data
	await setupCastMateDirectories()

	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		console.log("Trying to install dev tools")
		try {
			await installExtension(VUEJS_DEVTOOLS)
		} catch (err) {
			console.error("Failed to install vue dev tools", err)
		}
	}

	//Create the window
	await createMainWindow()

	//Creat initial systems
	await initializeCastMate()

	//Check if we need to migrate
	await checkMigration()

	//Load plugins (migrating settings as we go)
	await loadPlugins()

	await migrateAllOldAutomations()

	await loadAutomations()

	await finishMigration()

	await finializeCastMateSetup()

	//HACK HACK HACK HACK HACK
	await finishInitDashboards()

	//await testMigrate()
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
