import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"
import path from "path"
import { fileURLToPath } from "node:url"

import { library, plugins } from "castmate-vite"
//import Inspect from "vite-plugin-inspect"

const dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(dirname, "dist")

export default defineConfig({
	base: "/overlays/",
	plugins: [
		vue(),
		library("castmate-overlay-core"),
		library("castmate-overlay-widget-loader"),
		plugins("../../plugins", "overlay"),
	],
	resolve: {
		alias: {
			path: "path-browserify",
		},
	},
	build: {
		outDir: path.join(dist, "obs-overlay"),
		minify: false,
		rollupOptions: {
			input: {
				main: path.resolve(dirname, "overlay.html"),
			},
		},
	},
})
