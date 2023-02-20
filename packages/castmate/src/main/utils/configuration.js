import { app, ipcFunc, ipcMain } from "./electronBridge.js"
import path from "path"
import fs from "fs"

const isDevelopment = !app.isPackaged
const isPortable = process.argv.includes("--portable") // || isDevelopment;
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

export function ensureFolder(path) {
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path, { recursive: true })
	}
}

export function ensureFile(path) {
	if (!fs.existsSync(path)) {
		fs.writeFileSync(path, "")
	}
}

export function ensureUserFolder() {
	ensureFolder(userFolder)
	ensureFolder(path.join(userFolder, "data"))
	ensureFolder(path.join(userFolder, "profiles"))
	ensureFolder(path.join(userFolder, "secrets"))
	ensureFolder(path.join(userFolder, "sounds"))
	ensureFolder(path.join(userFolder, "cache"))
	ensureFolder(path.join(userFolder, "automations"))
	ensureFolder(mediaFolder)

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
