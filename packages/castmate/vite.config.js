
import { defineConfig } from 'vite'
import path, { resolve } from 'path'
import { rmSync } from 'fs'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import vuetify from 'vite-plugin-vuetify'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { fileURLToPath } from 'node:url'

import { subpackage } from '../../vite-util/vite-multipackage'

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(dirname, "dist");


rmSync('dist', { recursive: true, force: true }) // v14.14.0

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
    electron({
      main: {
        entry: resolve(dirname, 'src/main/backgroundLoader.cjs'),
        vite: withDebug({
          plugins: [nodeResolve(['node'])],
          build: {
            // target: 'node16.15',
            outDir: path.join(dist, 'electron/main'),
            rollupOptions: {
              external: ['public-ip', 'ffi-napi', 'ref-napi', 'ref-struct-di', 'win32-api', 'obs-websocket-js', 'ws'],
            }
          },
        }),
      },
      renderer: {
        resolve() {
          return ['fs', 'path']
        }
      },
    }),
    subpackage("castmate-overlay-components")
    //overlays ({ dirname })
  ],
  build: {
    outDir: path.join(dist, "/electron/renderer"),
    rollupOptions: {
      input: {
        main: resolve(dirname, 'index.html'),
        updater: resolve(dirname, 'updater.html')
      }
    }
  }
})

function withDebug(config) {
  if (process.env.VSCODE_DEBUG) {
    if (!config.build) config.build = {}
    config.build.sourcemap = true
    config.plugins = (config.plugins || []).concat({
      name: 'electron-vite-debug',
      configResolved(config) {
        const index = config.plugins.findIndex(p => p.name === 'electron-main-watcher');
        // At present, Vite can only modify plugins in configResolved hook.
        (config.plugins).splice(index, 1)
      },
    })
  }
  return config
}