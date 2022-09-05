import { build as viteBuild, mergeConfig, normalizePath } from "vite"
import path, { resolve } from "path"
import vue from '@vitejs/plugin-vue'

//Put any default options here

function getDefaultBuildConfig(config) {
    const defaultOverlayConfig = {
        configFile: false,
        publicDir: false,
        plugins: [vue({

        })],
        build: {
            outDir: 'dist/overlays',
            rollupOptions: {
                input: {
                    overlay: normalizePath(resolve(config.dirname, "src", "overlays", 'overlay.html')),
                }
            }
        }
    };
    return  defaultOverlayConfig;
}

async function buildOverlays(config, viteConfig) {
    const defaultOverlayConfig = getDefaultBuildConfig(config);

    const finalBuildConfig = mergeConfig(defaultOverlayConfig, config.vite || {});

    console.log("Building Overlays", finalBuildConfig);

    await viteBuild(finalBuildConfig);
}

async function serveOverlays(config) {
    const defaultOverlayConfig = getDefaultBuildConfig(config);

    const defaultServeConfig = {
        build: {
            mode: "development",
            watch: {
//                include: 'src/overlays/**',
//                exclude: 'src/overlays/vite/**'
            }
        },
    }

    const serveBuildConfig = mergeConfig(defaultOverlayConfig, defaultServeConfig);

    const finalBuildConfig = mergeConfig(serveBuildConfig, config.vite || {});

    console.log("Serving Overlays", finalBuildConfig.build.rollupOptions);

    await viteBuild(finalBuildConfig);
}

export function overlays(config) {
    const name = "castmate-overlays"

    return [
        {
            name: `${name}:serve`,
            apply: "serve",
            configureServer(server) {
                server.httpServer.on('listening', () => {
                    serveOverlays(config)
                })
            },
        },
        {
            name: `${name}:build`,
            apply: "build",
            async closeBundle() {
                await buildOverlays(config)
            }
        }
    ]
}