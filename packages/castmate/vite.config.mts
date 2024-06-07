import { defineConfig } from "vite"
import path, { resolve } from "path"
import { rmSync } from "fs"
import vue from "@vitejs/plugin-vue"
import electron from "vite-plugin-electron"
import renderer from "vite-plugin-electron-renderer"

import { fileURLToPath } from "node:url"
import { nodeResolve } from "@rollup/plugin-node-resolve"

import { library, plugins } from "castmate-vite"

const dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(dirname, "dist")

rmSync("dist", { recursive: true, force: true }) // v14.14.0

export default defineConfig({
	plugins: [
		vue(),
		renderer(),
		electron({
			entry: "src/main/background.ts",
			vite: {
				plugins: [nodeResolve()],
				build: {
					outDir: path.join(dist, "dist-electron"),
					minify: false,
					rollupOptions: {
						external: [
							"@ffmpeg-installer/win32-x64",
							"@ffprobe-installer/win32-x64",
							"@twurple/api-call",
							"@twurple/chat",
							"@twurple/eventsub-ws",
							"@twurple/pubsub",
							"ws",
							"discord.js",
							"castmate-plugin-sound-native",
							"castmate-plugin-input-native",
							"node-screenshots",
						],
					},
				},
				resolve: {
					alias: {
						"./lib-cov/fluent-ffmpeg": "./lib/fluent-ffmpeg", // This line
					},
				},
			},
		}),
		//subpackage("castmate-overlay-components"),
		library("castmate-ui-core"),
		plugins("../../plugins"),
	],
	build: {
		//outDir: path.join(dist, "electron/renderer"),
		minify: false,
		rollupOptions: {
			input: {
				main: resolve(dirname, "html", "index.html"),
				//updater: resolve(dirname, "updater.html"),
			},
			output: {
				manualChunks: {
					primevueConfirm: ["primevue/useconfirm", "primevue/confirmationservice"],
				},
			},
		},
	},
})
