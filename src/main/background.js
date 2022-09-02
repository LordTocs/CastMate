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

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
	app.quit()
	process.exit(0)
}

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

function createWindowBase(htmlFile, params, width, height) {
	
	
	const win = new BrowserWindow({
		width,
		height,
		icon: path.join(iconPath, 'icon.png'),
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
			contextIsolation: false,
		},
		frame: false
	})

	if (app.isPackaged) {
		const htmlFullPath = path.join(ROOT_PATH.renderer, htmlFile)
		console.log("Loading From File " + htmlFullPath);
		win.loadFile(htmlFullPath, {
			query: params
		})
	} else {
		const fullUrl = url + "/" + htmlFile
		console.log("Loading From URL " + fullUrl);
		win.loadURL(fullUrl, {
			query: params
		})
	}

	win.webContents.on('new-window', function (e, url) {
		e.preventDefault();
		shell.openExternal(url);
	});


	return win
}

async function createWindow() {
	const win = createWindowBase("index.html", null, 1600, 900);

	win.on("close", () => {
		//Workaround for electron bug.
		if (win.webContents.isDevToolsOpened()) {
			win.webContents.closeDevTools()
		}
	})

	win.on("closed", () => {
		app.quit();
	})

	mainWindow = win;
}

async function createUpdaterWindow(updateData) {
	const win = createWindowBase("updater.html", updateData, 600, 400)
	updateContext.window = win;
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
