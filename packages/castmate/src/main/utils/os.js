import { getFonts } from "font-list"
import { ipcFunc } from './electronBridge.js'
import logger from "./logger.js"
import thumbsupply from "thumbsupply"
import { app } from "./electronBridge.js"


export function osInit() {
    logger.info("Initing OS Util Funcs")

    ipcFunc("os", "getFonts", async () => {
        return await getFonts({ disableQuoting: true })
    })

    ipcFunc("media", "getThumbnail", async (videoFile) => {
        const thumbnail = await thumbsupply.generateThumbnail(videoFile, {
            size: thumbsupply.ThumbSize.MEDIUM,
            timestamp: "10%",
            cacheDir: app.getPath("temp"),
        })

        return thumbnail
    })
}