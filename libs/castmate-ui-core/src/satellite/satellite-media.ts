import { defineStore } from "pinia"
import { usePrimarySatelliteConnection, useSatelliteConnection } from "./satellite-connection"
import fs from "node:fs"
import path from "path"
import { hashString } from "castmate-schema"
import { handleIpcMessage, useInitStore, useIpcCaller } from "../main"
import { markRaw, ref } from "vue"

///https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js

const mainGetUserFolder = useIpcCaller<() => string>("filesystem", "getUserFolder")
const mainValidateRemoteMediaPath = useIpcCaller<(mediaFile: string) => string | undefined>(
	"media",
	"validateRemoteMediaPath"
)
const mainMediaRequestDone = useIpcCaller<(mediaFile: string, cacheName: string) => boolean>(
	"satellite",
	"mediaRequestDone"
)

export const useSatelliteMedia = defineStore("satellite-media", () => {
	const satelliteStore = useSatelliteConnection()
	const primaryConnection = usePrimarySatelliteConnection()

	const initStore = useInitStore()

	async function initialize() {
		handleIpcMessage(
			"satellite",
			"startMediaRequest",
			(event, mediaFile: string, cacheName: string, cacheFile: string) => {
				startMediaRequest(mediaFile, cacheName, cacheFile)
			}
		)

		if (initStore.isCastMate) {
			satelliteStore.registerRPCHandler(
				"satellite_requestMedia",
				async (connectionId: string, mediaFile: string) => {
					console.log("Handle Remote Media Request", mediaFile)
					const localPath = await mainValidateRemoteMediaPath(mediaFile)

					if (!localPath) return false

					const connection = satelliteStore.getConnectionById(connectionId)
					if (!connection) return false

					const channel = connection.connection.createDataChannel(`media:${mediaFile}`)
					channel.binaryType = "arraybuffer"

					const readStream = fs.createReadStream(localPath)
					readStream.on("data", (chunk) => {
						if (typeof chunk == "string") {
							channel.send(chunk)
						} else {
							channel.send(chunk.buffer)
						}
					})

					readStream.on("end", () => {
						console.log("Sent all media data for", mediaFile)
						channel.close()
					})

					readStream.on("error", () => {
						channel.close()
					})

					return true
				}
			)
		}
	}

	async function startMediaRequest(mediaFile: string, cacheName: string, cacheFile: string) {
		const userFolder = await mainGetUserFolder()

		if (!primaryConnection.value) throw new Error("Need connection to request media")

		console.log("Starting Media Request", mediaFile)

		const fileStream = markRaw(fs.createWriteStream(cacheFile))

		primaryConnection.value.mediaRequests.set(mediaFile, {
			filename: mediaFile,
			cachename: cacheName,
			fileStream,
			onDone: markRaw((state) => {
				fileStream.end()
				fileStream.close()
				primaryConnection.value?.mediaRequests.delete(mediaFile)

				if (state == "error") {
					try {
						fs.unlinkSync(cacheFile)
					} catch {}
				}

				mainMediaRequestDone(mediaFile, cacheName)
			}),
		})

		try {
			const success = await satelliteStore.callRPC(
				primaryConnection.value.id,
				"satellite_requestMedia",
				mediaFile
			)
			if (!success) {
				primaryConnection.value.mediaRequests.get(mediaFile)?.onDone("error")
			}
		} catch (err) {
			primaryConnection.value.mediaRequests.get(mediaFile)?.onDone("error")
		}
	}

	return { startMediaRequest, initialize }
})
