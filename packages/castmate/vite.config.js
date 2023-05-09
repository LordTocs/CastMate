import { defineConfig } from "vite"
import path, { resolve } from "path"
import { rmSync } from "fs"
import vue from "@vitejs/plugin-vue"
import electron from "vite-plugin-electron"
import renderer from "vite-plugin-electron-renderer"
import vuetify from "vite-plugin-vuetify"
import { fileURLToPath } from "node:url"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import { subpackage } from "../../vite-util/vite-subpackage-plugin"
import pkg from "./package.json"

const dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(dirname, "dist")

export default defineConfig(({ command }) => {
	rmSync("dist", { recursive: true, force: true }) // v14.14.0

	const isServe = command === "serve"
	const isBuild = command === "build"
	const sourcemap = isServe || !!process.env.VSCODE_DEBUG

	const additionalExternals = ["ref-napi", "ref-struct-di", "fluent-ffmpeg"]
	return {
		plugins: [
			vue(),
			vuetify({
				autoImport: true,
			}),
			electron({
				entry: "src/main/backgroundLoader.cjs",
				onstart(options) {
					if (process.env.VSCODE_DEBUG) {
						console.log("[startup] Electron App") //See the vscode debug script.
					} else {
						options.startup()
					}
				},
				vite: {
					plugins: [nodeResolve(["node"])],
					resolve: {
						alias: {
							"./lib-cov/fluent-ffmpeg": "./lib/fluent-ffmpeg",
						},
						preserveSymlinks: true,
					},
					build: {
						minify: false,
						outDir: path.join(dist, "electron/main"),
						rollupOptions: {
							external: [
								...Object.keys(
									"dependencies" in pkg
										? pkg.dependencies
										: {}
								),
								...additionalExternals,
							],
						},
					},
				},
			}),
			renderer({
				resolve: {
					fs: { type: "cjs" },
					path: { type: "cjs" },
					"fluent-ffmpeg": { type: "cjs" },
				},
			}),
			subpackage("castmate-overlay-components"),
		],
		resolve: {
			alias: {
				"./lib-cov/fluent-ffmpeg": "./lib/fluent-ffmpeg",
			},
			preserveSymlinks: true,
		},
		esbuild: {
			minifyIdentifiers: false,
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
			commonjsOptions: {
				esmExternals: true,
			},
		},
	}
})
