import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"
import path from "path"
import { fileURLToPath } from "node:url"
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js"

const dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(dirname, "dist")

export default defineConfig({
	plugins: [vue(), cssInjectedByJsPlugin()],
	resolve: {
		preserveSymlinks: true,
	},
	build: {
		minify: false,
		outDir: path.join(dist, "overlay-components"),
		lib: {
			entry: "src/widgetLoader.js",
			name: "CastMateOverlayComponents",
			fileName: "castmate-overlay-components",
		},
		rollupOptions: {
			external: ["vue", "path"],
			output: {
				// Provide global variables to use in the UMD build
				// for externalized deps
				globals: {
					vue: "Vue",
				},
			},
		},
	},
})
