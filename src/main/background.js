const isDevelopment = import.meta.env.DEV

import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { app, shell, ipcMain, BrowserWindow } = require('electron');

const __dirname = path.dirname(fileURLToPath(import.meta.url))

import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';

import electronUpdater from 'electron-updater';
const { autoUpdater, CancellationToken } = electronUpdater;
import path from 'path'

import { initCastMate } from './castmate.js';

autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.autoDownload = false;

//Setup dev update yaml only if we're in debug mode.
/*if (isDevelopment) {
	autoUpdater.updateConfigPath = path.join(
		__dirname,
		"../dev-app-update.yml" // change path if needed
	);
}*/

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
	app.quit()
	process.exit(0)
}

/*
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
	{ scheme: 'app', privileges: { secure: true, standard: true } }
])
*/



process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const dist = path.join(__dirname, '../..')
const renderer =  path.join(dist, 'electron', 'renderer')

const ROOT_PATH = {
	// /dist
	dist,
	renderer,
}

const iconPath = app.isPackaged ? renderer : 'src/renderer/assets/icons'

const preload = path.join(__dirname, '../preload/preload.js')
console.log(process.env);
const url = `http://${process.env['VITE_DEV_SERVER_HOSTNAME']}:${process.env['VITE_DEV_SERVER_PORT']}`

let mainWindow = null;
async function createWindow() {
	// Create the browser window.

	const indexHtml = path.join(ROOT_PATH.renderer, 'index.html')

	
	const win = new BrowserWindow({
		width: 1600,
		height: 900,
		icon: path.join(iconPath, 'icon.png'),
		webPreferences: {
			//preload,
			nodeIntegration: true,
			enableRemoteModule: true,
			contextIsolation: false,
		},
		frame: false
	})


	if (app.isPackaged) {
		win.loadFile(indexHtml)
	} else {
		win.loadURL(url)
	}

	win.on("close", () => {
		//Workaround for electron bug.
		if (win.webContents.isDevToolsOpened()) {
			win.webContents.closeDevTools()
		}
	})

	win.on("closed", () => {
		app.quit();
	})

	win.webContents.on('new-window', function (e, url) {
		e.preventDefault();
		shell.openExternal(url);
	});

	mainWindow = win;
}

async function createUpdaterWindow(updateData) {
	const updaterHtml = path.join(ROOT_PATH.dist, 'updater.html')

	const win = new BrowserWindow({
		width: 600,
		height: 400,
		icon: path.join(iconPath, 'icon.png'),
		webPreferences: {

			// Use pluginOptions.nodeIntegration, leave this alone
			// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
			nodeIntegration: true, //process.env.ELECTRON_NODE_INTEGRATION,
			enableRemoteModule: true,
			contextIsolation: false,
		},
		frame: false
	})

	//remoteMain.enable(win.webContents);

	const params = new URLSearchParams(updateData)

	if (app.isPackaged) {
		win.loadFile(updaterHtml + "?" + params)
	} else {
		win.loadURL(url + '/updater.html' + "?" + params)
	}

	updateContext.window = win;

	win.webContents.on('new-window', function (e, url) {
		e.preventDefault();
		shell.openExternal(url);
	});


}

const updateContext = {};

//WINDOW FUNCTIONS
ipcMain.handle("windowFuncs_minimize", async (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	win.minimize();
})

ipcMain.handle("windowFuncs_maximize", async (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	win.maximize();
})

ipcMain.handle("windowFuncs_restore", async (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	win.unmaximize();
})

ipcMain.handle("windowFuncs_close", async (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	win.close();
})

ipcMain.handle("windowFuncs_isMaximized", async (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	return win.isMaximized();
})

ipcMain.handle("windowFuncs_getVersion", async () => {
	return app.getVersion();
})


ipcMain.handle("updater.downloadUpdate", async () => {
	updateContext.cancelToken = new CancellationToken();
	await autoUpdater.downloadUpdate(updateContext.cancelToken);
	updateContext.cancelToken = null;
});

ipcMain.handle("updater.cancelUpdate", async () => {
	if (updateContext.cancelToken)
		updateContext.cancelToken.cancel();
});

ipcMain.handle("updater.checkForUpdates", doUpdateCheck);

autoUpdater.on("download-progress", (progress) => {
	console.log("Progress", progress);
});

autoUpdater.on("update-downloaded", () => {
	autoUpdater.quitAndInstall();
});

autoUpdater.on("update-available", async (updateInfo) => {
	const info = {
		releaseDate: updateInfo.releaseDate,
		releaseName: updateInfo.releaseName,
		releaseNotes: updateInfo.releaseNotes,
		version: updateInfo.version
	}

	await createUpdaterWindow(info);
})

async function doUpdateCheck() {
	autoUpdater.autoDownload = false;
	const result = await autoUpdater.checkForUpdates();
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		try {
			await installExtension(VUEJS_DEVTOOLS)
		} catch (e) {
			console.error('Vue Devtools failed to install:', e.toString())
		}
	}
	console.log("Starting CastMate Internals!")
	await createWindow()
	initCastMate(mainWindow.webContents)
	
	//autoUpdater.checkForUpdatesAndNotify();
	doUpdateCheck();
})


// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

console.log("Background.js");



// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
	if (process.platform === 'win32') {
		process.on('message', (data) => {
			if (data === 'graceful-exit') {
				app.quit()
			}
		})
	} else {
		process.on('SIGTERM', () => {
			app.quit()
		})
	}
}
