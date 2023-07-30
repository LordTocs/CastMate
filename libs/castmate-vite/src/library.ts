import fs from "fs"
import path from "path"
import { UserConfig, PluginOption } from "vite"

export function aliasPackage(name: string, dir: string): PluginOption[] {
	const packagePath = path.join(dir, name, "package.json")

	if (!fs.existsSync(packagePath)) {
		return []
	}

	const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"))

	const entry = path.resolve(path.join(dir, name), packageJson.devMain)
	return [
		{
			name: `${name}-sub:serve`,
			apply: "serve",
			config(config: UserConfig, { command }: { command: string }) {
				if (command == "build") return

				console.log("Aliasing", name, "to", entry)

				if (!config.resolve) config.resolve = {}
				if (!config.resolve.alias) config.resolve.alias = []

				if (config.resolve?.alias) {
					if (Array.isArray(config.resolve.alias)) {
						config.resolve.alias.push({
							find: name,
							replacement: entry,
						})
					} else {
						;(config.resolve.alias as { [find: string]: string })[name] = entry
					}
				}
			},
		},
	]
}

export function library(name: string): PluginOption {
	return aliasPackage(name, "../../libs")
}
