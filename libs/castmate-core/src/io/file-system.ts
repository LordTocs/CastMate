import * as fs from "fs/promises"
import * as fsSync from "fs"
import * as path from "path"
import * as YAML from "yaml"
import { BrowserWindow, IpcMainInvokeEvent, ipcMain, safeStorage } from "electron"
import { defineIPCFunc } from "../util/electron"

import { dialog } from "electron"
import { Schema, SchemaType } from "castmate-schema"

let activeProjectDirectory: string = ""

export async function ensureDirectory(path: string, onCreate?: () => any) {
	//console.log("Ensuring", path)
	if (!fsSync.existsSync(path)) {
		await fs.mkdir(path, { recursive: true })
		await onCreate?.()
	}
}

export async function setProjectDirectory(dir: string) {
	activeProjectDirectory = path.resolve(dir)
	console.log("Project Directory Set To", activeProjectDirectory)
	ensureDirectory(activeProjectDirectory, () => console.log("Project Directory Created"))
}

export function resolveProjectPath(...paths: string[]) {
	return path.resolve(activeProjectDirectory, ...paths)
}

export async function pathExists(...paths: string[]) {
	const fullPath = resolveProjectPath(...paths)
	return fsSync.existsSync(fullPath)
}

export async function ensureYAML<T = any>(defaultData: T, ...paths: string[]) {
	const fullPath = resolveProjectPath(...paths)
	if (!fsSync.existsSync(fullPath)) {
		await ensureDirectory(path.dirname(fullPath))
		const strData = YAML.stringify(defaultData)
		await fs.writeFile(fullPath, strData, "utf-8")
	}
}

export async function loadYAMLAbsolute(fullPath: string) {
	const strData = await fs.readFile(fullPath, "utf-8")
	const data = YAML.parse(strData)
	return data
}

export async function loadYAML<T = any>(...paths: string[]) {
	const fullPath = resolveProjectPath(...paths)

	return (await loadYAMLAbsolute(fullPath)) as T
}

export async function loadYAMLSchema<TSchema extends Schema>(schema: TSchema, ...paths: string[]) {
	const rawData = await loadYAML(...paths)

	//TODO: Deserialize / Unexpose

	//TODO: Construct Default if missing!

	return rawData as SchemaType<TSchema>
}

export async function writeYAML<T = any>(data: T, ...paths: string[]) {
	await fs.writeFile(resolveProjectPath(...paths), YAML.stringify(data), "utf-8")
}

export async function loadSecretYAML<T = any>(...paths: string[]) {
	const fullPath = resolveProjectPath(...paths)
	const buffer = await fs.readFile(fullPath)
	const strData = safeStorage.decryptString(buffer)
	return YAML.parse(strData) as T
}

export async function loadSecretYAMLSchema<TSchema extends Schema>(schema: TSchema, ...paths: string[]) {
	const rawData = await loadSecretYAML(...paths)

	//TODO: Deserialize / Unexpose

	//TODO: Construct default if missing!

	return rawData as SchemaType<TSchema>
}

export async function writeSecretYAML<T = any>(data: T, ...paths: string[]) {
	const strData = YAML.stringify(data)
	const buffer = safeStorage.encryptString(strData)
	await fs.writeFile(resolveProjectPath(...paths), buffer)
}

export async function initializeFileSystem() {
	ipcMain.handle(`filesystem_getUserFolder`, () => {
		return activeProjectDirectory
	})

	ipcMain.handle(`filesystem_getFolderInput`, async (event: IpcMainInvokeEvent, existing: string | undefined) => {
		const window = BrowserWindow.fromWebContents(event.sender)

		if (!window) return undefined

		const result = await dialog.showOpenDialog(window, {
			properties: ["openDirectory"],
			defaultPath: existing,
		})

		return result?.filePaths?.[0]
	})

	ipcMain.handle(
		"filesystem_getFileInput",
		async (event: IpcMainInvokeEvent, existing: string | undefined, exts: string[] | undefined) => {
			const window = BrowserWindow.fromWebContents(event.sender)

			if (!window) return undefined

			const filters: Electron.FileFilter[] = []

			if (exts?.length) {
				filters.push({
					name: "File",
					extensions: exts,
				})
			}

			filters.push({
				name: "All",
				extensions: ["*"],
			})

			const result = await dialog.showOpenDialog(window, {
				properties: ["openFile"],
				defaultPath: existing,
				filters,
			})

			return result?.filePaths?.[0]
		}
	)
}
