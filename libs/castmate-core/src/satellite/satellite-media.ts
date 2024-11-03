import { Service } from "../util/service"
import { createDelayedResolver, DelayedResolver, hashString } from "castmate-schema"
import path from "path"
import { ensureDirectory, resolveProjectPath } from "../io/file-system"
import fs from "fs"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { usePluginLogger } from "../logging/logging"
import { SatelliteService } from "./satellite-service"
import { app } from "electron"

function createCacheName(remoteId: string, mediaFile: string) {
	const ext = path.extname(mediaFile)
	const hash = hashString(`${remoteId}${mediaFile}`)

	return `media_${hash}${ext}`
}

const rendererStartMediaRequest = defineCallableIPC<(mediaFile: string, cacheName: string, cacheFile: string) => any>(
	"satellite",
	"startMediaRequest"
)

const logger = usePluginLogger("media-cache")

export const SatelliteMedia = Service(
	class {
		private pendingRequests = new Map<
			string,
			{
				resolver: DelayedResolver<string>
			}
		>()

		constructor() {}

		async initialize() {
			//await ensureDirectory(resolveProjectPath("mediaCache"))

			defineIPCFunc("satellite", "mediaRequestDone", (mediaFile: string, cacheName: string) => {
				const request = this.pendingRequests.get(mediaFile)
				if (!request) return

				const cachedFile = path.join(app.getPath("temp"), cacheName)

				if (!fs.existsSync(cachedFile)) request.resolver.reject(new Error("Media Failed Request"))

				request.resolver.resolve(cachedFile)
			})
		}

		async getMediaFile(mediaFile: string) {
			const connectionId = SatelliteService.getInstance().getCastMateConnection()
			if (!connectionId) throw new Error("Not Connected")
			const remoteId = SatelliteService.getInstance().getConnection(connectionId)?.remoteId
			if (!remoteId) throw new Error("Not Connected")

			const cacheName = createCacheName(remoteId, mediaFile)

			const cachedFile = path.join(app.getPath("temp"), cacheName)

			if (fs.existsSync(cachedFile)) {
				return cachedFile
			} else {
				logger.log("Media missing from cache, requesting...")
				const resolver = createDelayedResolver<string>()
				this.pendingRequests.set(mediaFile, {
					resolver,
				})

				rendererStartMediaRequest(mediaFile, cacheName, cachedFile)

				return await resolver.promise
			}
		}
	}
)
