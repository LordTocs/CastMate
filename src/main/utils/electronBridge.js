import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const electron = require("electron");

export const app = electron.app
export const ipcMain = electron.ipcMain
export const BrowserWindow = electron.BrowserWindow
export const safeStorage = electron.safeStorage



export function ipcFunc(category, name, func)
{
    ipcMain.handle(`${category}_${name}`, async (event, ...args) => { return await func(...args) });
}