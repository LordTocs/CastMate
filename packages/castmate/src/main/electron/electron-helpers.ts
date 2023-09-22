import { BrowserWindow, app, shell, ipcMain } from "electron"
import path from "path"

const viteDevURL = `http://${process.env["VITE_DEV_SERVER_HOSTNAME"]}:${process.env["VITE_DEV_SERVER_PORT"]}`

const iconPath = "TODO"

export function createWindow(
	htmlFile: string,
	width: number,
	height: number,
	urlQuery: Record<string, string> = {},
	icon: string = "icon.png"
) {
	const win = new BrowserWindow({
		width,
		height,
		icon: path.join(iconPath, icon),
		webPreferences: {
			//TODO: Look into these
			nodeIntegration: true,
			contextIsolation: false,
			webSecurity: false,
		},
		frame: false,
	})

	if (process.env.VITE_DEV_SERVER_URL) {
		//get it from vite
		const url = path.posix.join(process.env.VITE_DEV_SERVER_URL, "html", htmlFile)
		win.loadURL(url) //TODO: FORMAT URL WITH QUERY
	} else {
		win.loadFile(path.join(__dirname, `../../../dist/html/${htmlFile}`))
	}

	win.addListener("maximize", () => {
		console.log("maximized")
		win.webContents.send("windowFuncs_stateChanged", "maximized")
	})

	win.addListener("minimize", () => {
		console.log("minimized")
		win.webContents.send("windowFuncs_stateChanged", "minimized")
	})

	win.addListener("unmaximize", () => {
		console.log("unmaximized")
		win.webContents.send("windowFuncs_stateChanged", "unmaximized")
	})

	win.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url)
		return { action: "deny" }
	})

	/*
	win.webContents.on("new-window", function (e, url) {
		e.preventDefault()
		shell.openExternal(url)
	})
	*/

	return win
}

//WINDOW FUNCTIONS
ipcMain.handle("windowFuncs_minimize", async (event) => {
	const win = BrowserWindow.fromWebContents(event.sender)
	win?.minimize()
})

ipcMain.handle("windowFuncs_maximize", async (event) => {
	const win = BrowserWindow.fromWebContents(event.sender)
	win?.maximize()
})

ipcMain.handle("windowFuncs_restore", async (event) => {
	const win = BrowserWindow.fromWebContents(event.sender)
	win?.unmaximize()
})

ipcMain.handle("windowFuncs_close", async (event) => {
	const win = BrowserWindow.fromWebContents(event.sender)
	win?.close()
})

ipcMain.handle("windowFuncs_isMaximized", async (event) => {
	const win = BrowserWindow.fromWebContents(event.sender)
	return win?.isMaximized()
})
