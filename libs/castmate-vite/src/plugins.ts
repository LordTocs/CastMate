import fs from "fs"
import path from "path"
import { UserConfig, PluginOption } from "vite"
import { aliasPackage } from "./library.js"

interface PackageJSON {
	name: string
	workspaces: string[]
}

export function plugins(folder: string, sublib: string = "renderer"): PluginOption {
	const folderItems = fs.readdirSync(folder)

	console.log(folderItems)

	const result: PluginOption[] = []

	for (let pluginFolder of folderItems) {
		const pluginPackageJsonPath = path.join(folder, pluginFolder, "package.json")
		if (!fs.existsSync(pluginPackageJsonPath)) {
			continue
		}

		const packageJson = JSON.parse(fs.readFileSync(pluginPackageJsonPath, "utf8")) as PackageJSON

		if (!packageJson.name.startsWith("castmate-plugin")) {
			//ERROR OR SOMETHING?
			continue
		}

		const requestedPackagePath = path.join(folder, pluginFolder, sublib)

		const requestedPackageName = `${packageJson.name}-${sublib}`
		if (fs.existsSync(requestedPackagePath)) {
			result.push(...aliasPackage(requestedPackageName, requestedPackagePath))

			// if (sublib == "main") {
			// 	result.push({
			// 		name: `${requestedPackageName}-main-sub:serve`,
			// 		apply: "serve",
			// 		config(config, env) {
			// 			config.build?.dynamicImportVarsOptions?.include
			// 		},
			// 	})
			// }
		}
	}

	return result
}
