//import { build as viteBuild, mergeConfig, loadConfigFromFile } from "vite"
import fs from "fs"
import path from "path"

export function subpackage(name) {
	const packageJson = JSON.parse(fs.readFileSync(`../${name}/package.json`))

	const entry = path.resolve(`../${name}`, packageJson.devMain)

	return [
		{
			name: `${name}-sub:serve`,
			apply: "serve",
			config(config, { command }) {
				if (command == "build") return

				console.log("Aliasing", name, "to", entry)

				if (!config.resolve) config.resolve = {}
				if (!config.resolve.alias) config.resolve.alias = []

				if (Array.isArray(config.resolve.alias)) {
					config.resolve.alias.push({
						find: name,
						replacement: entry,
					})
				} else {
					config.resolve.alias[name] = entry
				}
			},
		},
	]
}
