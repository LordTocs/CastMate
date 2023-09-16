import * as fs from "fs/promises"
import * as fsSync from "fs"
import * as path from "path"
import * as YAML from "yaml"
import { safeStorage } from "electron"

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

export async function loadYAML<T = any>(...paths: string[]) {
	const fullPath = resolveProjectPath(...paths)
	const strData = await fs.readFile(fullPath, "utf-8")
	const data = YAML.parse(strData)

	return data as T
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

export async function writeSecretYAML<T = any>(data: T, ...paths: string[]) {
	const strData = YAML.stringify(data)
	const buffer = safeStorage.encryptString(strData)
	await fs.writeFile(resolveProjectPath(...paths), buffer)
}
