import { getFonts } from "font-list"
import { ipcFunc } from './electronBridge.js'
import logger from "./logger.js"


export function osInit() {
    logger.info("Initing OS Util Funcs")

    ipcFunc("os", "getFonts", async () => {
        return await getFonts({ disableQuoting: true })
    })
}