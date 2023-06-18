import { BrowserWindow, app, shell } from "electron"
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
		//frame: false,
	})

	if (process.env.VITE_DEV_SERVER_URL) {
		//get it from vite
		const url = path.posix.join(process.env.VITE_DEV_SERVER_URL, "html", htmlFile)
		win.loadURL(url) //TODO: FORMAT URL WITH QUERY
	} else {
		win.loadFile(path.join(__dirname, `../../../dist/html/${htmlFile}`))
	}

	/*
	win.webContents.on("new-window", function (e, url) {
		e.preventDefault()
		shell.openExternal(url)
	})
	*/

	return win
}
