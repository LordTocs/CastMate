import { defineConfig } from "vite"
import path, { resolve } from "path"
import { rmSync } from "fs"
import vue from "@vitejs/plugin-vue"
import electron from "vite-plugin-electron"
import vuetify from "vite-plugin-vuetify"
import { fileURLToPath } from "node:url"
import { nodeResolve } from "@rollup/plugin-node-resolve"

import { subpackage } from "../../vite-util/vite-subpackage-plugin"

const dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(dirname, "dist")

rmSync("dist", { recursive: true, force: true }) // v14.14.0

export default defineConfig({
	plugins: [
		vue(),
		vuetify({
			autoImport: true,
		}),
		electron({
			main: {
				entry: "src/main/backgroundLoader.cjs",
				vite: withDebug({
					plugins: [nodeResolve(["node"])],
					resolve: {
						alias: {
							"./lib-cov/fluent-ffmpeg": "./lib/fluent-ffmpeg", // This line
						},
					},
					build: {
						// target: 'node16.15',
						outDir: path.join(dist, "electron/main"),
						rollupOptions: {
							// format: 'cjs',
							external: [
								"public-ip",
								"ffi-napi",
								"ref-napi",
								"ref-struct-di",
								"win32-api",
								"obs-websocket-js",
								"ws",
								"fluent-ffmpeg",
							],
						},
					},
				}),
			},
			renderer: {
				resolve() {
					return ["fs", "path", "fluent-ffmpeg"]
				},
			},
		}),
		subpackage("castmate-overlay-components"),
	],
	resolve: {
		alias: {
			"./lib-cov/fluent-ffmpeg": "./lib/fluent-ffmpeg", // This line
		},
	},
	build: {
		outDir: path.join(dist, "electron/renderer"),
		minify: false,
		rollupOptions: {
			input: {
				main: resolve(dirname, "index.html"),
				updater: resolve(dirname, "updater.html"),
			},
			external: ["fluent-ffmpeg"],
		},
	},
})

function withDebug(config) {
	if (process.env.VSCODE_DEBUG) {
		if (!config.build) config.build = {}
		config.build.sourcemap = true
		config.plugins = (config.plugins || []).concat({
			name: "electron-vite-debug",
			configResolved(config) {
				const index = config.plugins.findIndex(
					(p) => p.name === "electron-main-watcher"
				)
				// At present, Vite can only modify plugins in configResolved hook.
				config.plugins.splice(index, 1)
			},
		})
	}
	return config
}
