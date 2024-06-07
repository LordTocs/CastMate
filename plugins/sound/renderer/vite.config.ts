import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import dts from "vite-plugin-dts"
import { libraryPlugin } from "castmate-vite"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		dts({
			insertTypesEntry: true,
		}),
		libraryPlugin("castmate-ui-core"),
	],
	build: {
		cssCodeSplit: true,
		lib: {
			entry: "src/main.ts",
			name: "castmate-plugin-sound-renderer",
		},
		rollupOptions: {
			external: ["vue"],
			output: {
				exports: "named",
				globals: {
					vue: "Vue",
				},
			},
		},
	},
})
