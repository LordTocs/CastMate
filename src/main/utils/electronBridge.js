import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const electron = require("electron");

export const app = electron.app
export const ipcMain = electron.ipcMain
export const BrowserWindow = electron.BrowserWindow
