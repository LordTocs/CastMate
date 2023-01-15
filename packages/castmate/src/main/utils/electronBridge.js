import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const electron = require("electron");

export const app = electron.app
export const ipcMain = electron.ipcMain
export const BrowserWindow = electron.BrowserWindow
export const safeStorage = electron.safeStorage
export const dialog = electron.dialog

let mainIpcSender = null;
/**
 * 
 * @param {Electron.WebContents} ipcSender 
 */
export function setIpcSender(ipcSender) {
    mainIpcSender = ipcSender
}

/**
 * 
 * @param {String} funcName 
 * @param {*} payload 
 * @returns 
 */
export function callIpcFunc(funcName, payload) {
    if (!mainIpcSender)
    {
        console.error(`Tried to call renderer IPC function ${funcName} but we had no ipcSender`)   
        return;
    }
    mainIpcSender.send(funcName, payload);
}

/**
 * 
 * @param {String} category 
 * @param {String} name 
 * @param {CallableFunction} func 
 */
export function ipcFunc(category, name, func)
{
    ipcMain.handle(`${category}_${name}`, async (event, ...args) => { return await func(...args) });
}