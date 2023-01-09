import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'node:url'

import { subpackage } from '../../vite-util/vite-subpackage-plugin'
import Inspect from 'vite-plugin-inspect'

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(dirname, "dist");


export default defineConfig({
    base: '/overlays/',
    plugins: [
        Inspect(),
        vue(),
        subpackage("castmate-overlay-components")
    ],
    resolve: {
        alias: {
            path: "path-browserify",
        }
    },
    build: {
        outDir: path.join(dist, "obs-overlay"),
        minify: false,
        rollupOptions: {
            input: {
                main: path.resolve(dirname, 'overlay.html'),
            },
        },
    },
});