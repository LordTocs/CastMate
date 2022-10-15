import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(dirname, "dist");

export default defineConfig({
    plugins: [ vue() ],
    build: {
        outDir: path.join(dist, "overlay-components"),
        lib: {
            entry: path.resolve(dirname, "./src/widgetLoader.js"),
            name: "CastMateOverlayComponents",
            fileName: "castmate-overlay-components"
        },
        rollupOptions: {
            external: [ 
                'vue'
            ],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                  vue: 'Vue'
                }
            }
        },
    }
});