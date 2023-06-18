import { app, ipcFunc, ipcMain } from "./electronBridge.js"
import path from "path"
import fse from "fs-extra"
import fs from "fs"

const isDevelopment = !app.isPackaged

const isPortable =
	process.argv.includes("--portable") ||
	(isDevelopment && (import.meta.env.VITE_DEV_USE_GLOBAL != "true"))
export const userFolder = path.resolve(
	!isPortable ? path.join(app.getPath("userData"), "user") : "./user"
)
export const mediaFolder = path.resolve(path.join(userFolder, "media"))

export const settingsFilePath = path.resolve(
	path.join(userFolder, "settings.yaml")
)
export const secretsFilePath = path.resolve(
	path.join(userFolder, "secrets/secrets.yaml")
)
export const segmentsFilePath = path.resolve(
	path.join(userFolder, "segments.yaml")
)
export const variablesFilePath = path.resolve(
	path.join(userFolder, "variables.yaml")
)
export const stateFilePath = path.resolve(path.join(userFolder, "state.yaml"))

export function ensureFolder(pathlike, onCreate) {
	if (!fs.existsSync(pathlike)) {
		fs.mkdirSync(pathlike, { recursive: true })

		if (onCreate) onCreate()
	}
}

export async function ensureContent(source, dest) {
	await fse.copy(source, dest, {
		filter: (src, dest) => {
			if (fs.statSync(src).isDirectory()) return true

			return !fs.existsSync(dest)
		},
	})
}

export function ensureFile(path) {
	if (!fs.existsSync(path)) {
		fs.writeFileSync(path, "")
	}
}

export function ensureUserFolder() {
	console.log("User Folder", userFolder)
	ensureFolder(userFolder)
	ensureFolder(path.join(userFolder, "data"))
	ensureFolder(path.join(userFolder, "profiles"))
	ensureFolder(path.join(userFolder, "secrets"))
	//ensureFolder(path.join(userFolder, "sounds"))
	ensureFolder(path.join(userFolder, "cache"))
	ensureFolder(path.join(userFolder, "automations"))
	ensureFolder(mediaFolder, async () => {
		const sounds = path.join(userFolder, "sounds")

		//TODO: Copy starter media

		if (fs.existsSync(sounds)) {
			//Copy existing sounds to the media folder.
			await fse.copy(sounds, mediaFolder)
		}
	})

	ensureContent("./starter_media", mediaFolder)

	ensureFile(secretsFilePath)
	ensureFile(settingsFilePath)
	ensureFile(segmentsFilePath)
	ensureFile(variablesFilePath)
	ensureFile(stateFilePath)
}

ipcFunc("core", "getPaths", async () => {
	return {
		userFolder,
		mediaFolder,
	}
})
