import { build as viteBuild, defineConfig, mergeConfig, normalizePath } from "vite"
import path, { resolve } from "path"
import vue from '@vitejs/plugin-vue'

function getWidgetsConfig(config) {
    const defaultConfig = defineConfig({
        configFile: false,
        publicDir: false,
        plugins: [vue()],
        build: {
            outDir: 'dist/overlays/widgets',
            lib: {
                entry: normalizePath(resolve(config.dirname, "src", "overlays", "widgets", "widgetLoader.js")),
                formats: ['cjs'],
                fileName: () => '[name].js',
            },
            rollupOptions: {
                external: ['vue']
            }
        }
    });
    console.log("Widgets Entry", defaultConfig.build.lib.entry);
    return  mergeConfig(defaultConfig, config.widgets || {});
}

function getLoaderConfig(config) {
    const defaultConfig = defineConfig({
        configFile: false,
        publicDir: false,
        plugins: [vue()],
        base: "/overlays/",
        build: {
            outDir: 'dist/overlays/loader',
            rollupOptions: {
                input: {
                    overlay: normalizePath(resolve(config.dirname, "overlay.html")),
                }
            },
            external: ['./WidgetLoader.vue']
        }
    });
    return  mergeConfig(defaultConfig, config.loader || {});;
}

function addWatch(viteConfig, directory) {
    const watchConfig = {
        build: {
            mode: "development",
            watch: {
                include: `src/overlays/${directory}`
            }
        },
    }

    mergeConfig(watchConfig, viteConfig);
}


async function buildConfig(viteConfig) {
    await viteBuild(viteConfig);
}

async function serveConfig(viteConfig, directory) {
    await viteBuild(addWatch(viteConfig, directory))
}


export function overlays(config) {
    const loader = "castmate-overlay-loader"
    const widgets = "castmate-overlay-widgets"

    return [
        /*{
            name: `${loader}:serve`,
            apply: "serve",
            configureServer(server) {
                server.httpServer.on('listening', () => {
                    serveConfig(getLoaderConfig(config), "loader")
                })
            },
        },*/
        {
            name: `${loader}:build`,
            apply: "build",
            async closeBundle() {
                await buildConfig(getLoaderConfig(config))
            }
        },
        /*{
            name: `${widgets}:serve`,
            apply: "serve",
            configureServer(server) {
                server.httpServer.on('listening', () => {
                    serveConfig(getWidgetsConfig(config), "widgets")
                })
            },
        },*/
        {
            name: `${widgets}:build`,
            apply: "build",
            async closeBundle() {
                await buildConfig(getWidgetsConfig(config))
            }
        }
    ]
}