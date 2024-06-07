import path from "path"
import fsSync from "fs"
import fs from "fs/promises"

async function deleteNodeModules(basePath) {
	const dir = path.join(basePath, "node_modules")
	if (fsSync.existsSync(dir)) {
		console.log("Deleting", dir)
		await fs.rm(dir, { recursive: true, force: true })
	}
}

async function getFolders(basePath) {
	const dirContents = await fs.readdir(basePath)
	return dirContents.filter((d) => !d.includes("."))
}

async function handlePlugins() {
	const dirs = await getFolders("./plugins")

	for (const plugin of dirs) {
		const pluginPath = path.join("./plugins/", plugin)
		await deleteNodeModules(pluginPath)

		const subFolders = (await getFolders(pluginPath)).filter((p) => p != "node_modules")
		for (const subModule of subFolders) {
			const subModuleFolder = path.join(pluginPath, subModule)
			await deleteNodeModules(subModuleFolder)
		}
	}
}

async function handlePackages() {
	const dirs = await getFolders("./packages")

	for (const pack of dirs) {
		const packagePath = path.join("./packages/", pack)
		await deleteNodeModules(packagePath)
	}
}

async function handleLibs() {
	const dirs = await getFolders("./libs")

	for (const lib of dirs) {
		const libPath = path.join("./libs/", lib)
		await deleteNodeModules(libPath)
	}
}

async function clear() {
	deleteNodeModules("./")
	handleLibs()
	handlePackages()
	handlePlugins()
}

clear()
