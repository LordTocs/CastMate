import { defineIPCFunc, usePluginLogger, getLocalIP } from "castmate-core"
import { Window } from "node-screenshots"

import jsQR from "jsqr"
import OBSWebSocket from "obs-websocket-js"

const logger = usePluginLogger("obs")

export async function attemptQRReading() {
	try {
		logger.log("Attempting OBS QR Reading")

		const connectWindow = Window.all().find((w) => w.title == "WebSocket Connect Info")

		if (!connectWindow) return undefined

		logger.log("Found OBS QR Window")

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

export async function testOBSConnectionDetails(hostname: string, port: number, password: string | undefined) {
	const socket = new OBSWebSocket()

	try {
		await socket.connect(`ws://${hostname}:${port}`, password)
		socket.disconnect().catch((err) => {})
		return true
	} catch (err) {
		return false
	}
}

export function setupAutoConnect() {
	defineIPCFunc("obs", "attemptQRReading", attemptQRReading)
	defineIPCFunc("obs", "testOBSConnectionDetails", testOBSConnectionDetails)
}
