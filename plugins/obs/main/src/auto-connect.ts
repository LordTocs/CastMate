import { defineIPCFunc, usePluginLogger, getLocalIP } from "castmate-core"
import { Window } from "node-screenshots"

import jsQR from "jsqr"

const logger = usePluginLogger("obs")

export async function attemptQRReading() {
	try {
		const connectWindow = Window.all().find((w) => w.title == "WebSocket Connect Info")

		if (!connectWindow) return undefined

		const image = await connectWindow.captureImage()

		const buffer = await image.toRaw()

		const result = jsQR(Uint8ClampedArray.from(buffer), image.width, image.height)

		if (!result?.data) return undefined

		const parseExp = /obsws:\/\/([\d\.]+):(\d+)\/?(.*)/
		const parseResult = result.data.match(parseExp)
		if (!parseResult) return undefined
		let [all, ip, portStr, password] = parseResult

		const localIp = getLocalIP()
		if (localIp == ip) {
			ip = "localhost"
		}

		const port = Number(portStr)

		return {
			host: "localhost",
			port,
			password,
		}
	} catch (err) {
		logger.error("Error Looking for QR", err)
		return undefined
	}
}

export function setupAutoConnect() {
	defineIPCFunc("obs", "attemptQRReading", attemptQRReading)
}
