import { defineConfig } from "vite"
import path, { resolve } from "path"
import { rmSync } from "fs"
import vue from "@vitejs/plugin-vue"
import electron from "vite-plugin-electron"
import renderer from "vite-plugin-electron-renderer"
import dts from "vite-plugin-dts"

import { fileURLToPath } from "node:url"
//import { nodeResolve } from "@rollup/plugin-node-resolve"

import { library } from "castmate-vite"
//import { library, subpackage } from "../../vite-util/vite-subpackage-plugin"

const dirname = path.dirname(fileURLToPath(import.meta.url))
//const dist = path.join(dirname, "dist")

rmSync("dist", { recursive: true, force: true }) // v14.14.0

export default defineConfig({
	plugins: [
		vue(),
		renderer(),
		electron({
			entry: "src/main/background.ts",
		}),
		//subpackage("castmate-overlay-components"),
		library("castmate-ui-core"),
	],
	/*resolve: {
		alias: {
			"./lib-cov/fluent-ffmpeg": "./lib/fluent-ffmpeg", // This line
		},
	},*/
	build: {
		//outDir: path.join(dist, "electron/renderer"),
		minify: false,
		rollupOptions: {
			input: {
				main: resolve(dirname, "html", "index.html"),
				//updater: resolve(dirname, "updater.html"),
			},
			//external: ["fluent-ffmpeg"],
		},
	},
})
