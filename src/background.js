'use strict'

import { app, protocol, BrowserWindow, shell, ipcRenderer, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { initCastMate } from './core/castmate'
import { autoUpdater, CancellationToken } from 'electron-updater';
import path from 'path';
const isDevelopment = process.env.NODE_ENV !== 'production'

autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.autoDownload = false;


if (process.env.WEBPACK_DEV_SERVER_URL) {
	autoUpdater.updateConfigPath = path.join(
		__dirname,
		"../dev-app-update.yml" // change path if needed
	);
}

require('@electron/remote/main').initialize()
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
	{ scheme: 'app', privileges: { secure: true, standard: true } }
])

let mainWindow = null;

async function createWindow() {
	// Create the browser window.
	const win = new BrowserWindow({
		width: 1600,
		height: 1080,
		icon: 'src/assets/icons/icon.png',
		webPreferences: {

			// Use pluginOptions.nodeIntegration, leave this alone
			// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
			nodeIntegration: true, //process.env.ELECTRON_NODE_INTEGRATION,
			enableRemoteModule: true,
			contextIsolation: false,
		},
		frame: false
	})

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		// Load the url of the dev server if in development mode
		await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
		if (!process.env.IS_TEST) win.webContents.openDevTools()
	} else {
		createProtocol('app')
		// Load the index.html when not in development
		win.loadURL('app://./index.html')
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
	const win = new BrowserWindow({
		width: 600,
		height: 400,
		icon: 'src/assets/icons/icon.png',
		webPreferences: {

			// Use pluginOptions.nodeIntegration, leave this alone
			// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
			nodeIntegration: true, //process.env.ELECTRON_NODE_INTEGRATION,
			enableRemoteModule: true,
			contextIsolation: false,
		},
		frame: false
	})

	const params = new URLSearchParams(updateData)

	let baseUrl;

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		// Load the url of the dev server if in development mode
		baseUrl = process.env.WEBPACK_DEV_SERVER_URL + "updater";
		//if (!process.env.IS_TEST) win.webContents.openDevTools()
	} else {
		createProtocol('app')
		// Load the index.html when not in development
		baseUrl = 'app://./updater.html';
	}

	updateContext.window = win;

	win.loadURL(baseUrl + "?" + params);

	win.webContents.on('new-window', function (e, url) {
		e.preventDefault();
		shell.openExternal(url);
	});
}

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

const updateContext = {};

ipcMain.handle("updater.downloadUpdate", async () => {
	updateContext.cancelToken = new CancellationToken();
	await autoUpdater.downloadUpdate(updateContext.cancelToken);
	updateContext.cancelToken = null;
});

ipcMain.handle("updater.cancelUpdate", async () => {
	if (updateContext.cancelToken)
		updateContext.cancelToken.cancel();
});

autoUpdater.on("download-progress", (progress) => {
	console.log("Progress", progress);
});

autoUpdater.on("update-downloaded", () => {
	autoUpdater.quitAndInstall();
});

async function doUpdateCheck() {
	autoUpdater.autoDownload = false;
	const result = await autoUpdater.checkForUpdates();

	if (!result)
		return;


	const updateInfo = {
		releaseDate: result.updateInfo.releaseDate,
		releaseName: result.updateInfo.releaseName,
		releaseNotes: result.updateInfo.releaseNotes,
		version: result.updateInfo.version
	}

	await createUpdaterWindow(updateInfo);
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		try {
			await installExtension(VUEJS_DEVTOOLS)
		} catch (e) {
			console.error('Vue Devtools failed to install:', e.toString())
		}
	}
	initCastMate()
	createWindow()
	//autoUpdater.checkForUpdatesAndNotify();
	doUpdateCheck();
})



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
