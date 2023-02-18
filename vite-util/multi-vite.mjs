import { build as viteBuild, defineConfig, mergeConfig, loadConfigFromFile, createLogger, createServer } from "vite"
import path from "path"
import { fileURLToPath } from 'node:url'
import { spawn } from "child_process";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/*
Attempts to build and serve packages

async function buildPackage(config, name) {
    const dir = path.resolve(`./packages/${name}/`);
    config.logger.info(`Building ${name}: ${dir}`);
    const viteConfig = await loadConfigFromFile(config.env, null, dir)

    if (!viteConfig)
    {
        config.logger.error(`Unable to load config ${name}`)
        config.logger.error(`   ${dir}`)
        return;
    }

    const finalConfig = mergeConfig({
        root: dir,
        logger: config.logger
    }, viteConfig.config)

    await viteBuild(finalConfig);
}

async function servePackage(config, name) {
    const dir = path.resolve(`./packages/${name}/`);
    config.logger.info(`Building ${name}: ${dir}`);
    const viteConfig = await loadConfigFromFile(config.env, null, dir)

    if (!viteConfig)
    {
        config.logger.error(`Unable to load config ${name}`)
        config.logger.error(`   ${dir}`)
        return;
    }

    const finalConfig = mergeConfig({
        root: dir,
        logger: config.logger,
        server: {
            middlewareMode: true,
            hmr: {

            }
        }
    }, viteConfig.config)
}
*/

/**
 * Starts a vite build process in the package's directory.
 * 
 * @param {*} name 
 * @returns 
 */
function buildPackageSpawn(name) {
    return new Promise((resolve, reject) => {
        const dir = path.resolve(`./packages/${name}/`);
        const viteJs = path.resolve(`./node_modules/vite/bin/vite.js`);
        const args = [viteJs, "build"];
        try {
            spawn("node", args, { cwd: dir, stdio: "inherit" }).once("exit", () => {
                resolve();
            })
        }
        catch(err) {
            reject(err)
        }
    })
}

/**
 * Starts a vite serve process in the packages directory
 */
async function servePackageSpawn(config, name) {
    const dir = path.resolve(`./packages/${name}/`);
    const viteJs = path.resolve(`./node_modules/vite/bin/vite.js`);
    const args = [viteJs];
    if (config.port) {
        args.push("--port");
        args.push(config.port)
    }
    return spawn("node", args, { cwd: dir, stdio: "inherit" })
}


async function build() {
    await buildPackageSpawn("castmate-overlay-components")
    await buildPackageSpawn("castmate-obs-overlay")
    await buildPackageSpawn("castmate")
}

async function serve() {

    const config = {
        logger: createLogger(),
        env: {
            command: 'development',
            mode: 'serve',
        },
    };

    const castmateDev = await servePackageSpawn({ port: 5173, ...config}, "castmate")
    const overlayDev = await servePackageSpawn({ port: 5174, ...config}, "castmate-obs-overlay")

    castmateDev.on('close', ()=> {
        overlayDev.kill('SIGTERM');
    })
}

async function main() {
    const isBuild = process.argv[2] == 'build'

    if (isBuild)
        await build()
    else
        await serve();
}

main()

