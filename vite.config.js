
import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url));


export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
    electron.default({
      main: {
        entry: 'src/main/background.js',
        vite: {
          build: {
            sourcemap: true,
            outDir: 'dist/electron/main',
          },
        },
      },
      /*preload: {
        input: {
          preload: 'src/preload/preload.js'
        },
        vite: {
          build: {
            // For debug
            sourcemap: 'inline',
            outDir: 'dist/electron/preload',
          }
        }
      },*/
      renderer: {
      },
    })
  ],
})