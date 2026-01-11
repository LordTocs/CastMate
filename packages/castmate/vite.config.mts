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
				esbuild: {
					format: "esm",
				},
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
							"ws",
							"discord.js",
							"castmate-plugin-sound-native",
							"castmate-plugin-input-native",
							"node-screenshots",
							"better-sqlite3",
							"@azure/web-pubsub-client",
						],
					},
					// commonjsOptions: {
					// 	esmExternals: true,
					// 	requireReturnsDefault: "auto",
					// },
				},
				resolve: {
					alias: {
						//"./lib-cov/fluent-ffmpeg": "./lib/fluent-ffmpeg", // This line
					},
				},
			},
			onstart(args) {
				console.log("Vite Electron Start")
				args.startup([".", "--no-sandbox"])
			},
		}),
		//subpackage("castmate-overlay-components"),
		library("castmate-ui-core"),
		plugins("../../plugins"),
	],
	build: {
		//outDir: path.join(dist, "electron/renderer"),
		target: "esnext",
		minify: false,
		rollupOptions: {
			input: {
				main: resolve(dirname, "html", "index.html"),
			},
			output: {
				manualChunks: {
					primevueConfirm: ["primevue/useconfirm", "primevue/confirmationservice"],
				},
			},
		},
	},
})
