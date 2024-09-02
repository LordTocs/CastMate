import { Service } from "../util/service"
import { ImageFormats, MediaMetadata, stillImageFormats } from "castmate-schema"
import * as fs from "fs/promises"
import * as fsSync from "fs"
import path, * as pathTools from "path"
import * as rra from "recursive-readdir-async"
import * as ffmpeg from "fluent-ffmpeg"
import * as chokidar from "chokidar"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { ensureDirectory, resolveProjectPath } from "../io/file-system"
import { shell, app } from "electron"
import { globalLogger, usePluginLogger } from "../logging/logging"
import { WebService } from "../webserver/internal-webserver"
import express, { Application, response, Router } from "express"
import { coreAxios } from "../util/request-utils"
//require("@ffmpeg-installer/win32-x64")
//require("@ffprobe-installer/win32-x64")
//Thumbnails?
//Durations?

import http from "http"

const logger = usePluginLogger("media")

function probeMedia(file: string) {
	return new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
		ffmpeg.ffprobe(file, (err, data) => {
			if (err) {
				return reject(err)
			}

			return resolve(data)
		})
	})
}

const addOrUpdateMediaRenderer = defineCallableIPC<(metadata: MediaMetadata) => void>("media", "addMedia")
const removeMediaRenderer = defineCallableIPC<(relpath: string) => void>("media", "removeMedia")

export interface MediaFolder {
	id: string
	path: string
	watcher: chokidar.FSWatcher
}
/*
function downloadFile(url: string, dest: string) {
	return new Promise<void>((resolve, reject) => {
		const writeStream = fsSync.createWriteStream(dest)

		const request = http.get(url, (resp) => {
			if (resp.statusCode !== 200) {
				reject(`Failed to download ${url} with ${resp.statusCode}`)
			}

			resp.pipe(writeStream)
		})

		writeStream.on("finish", () => {
			writeStream.close((err) => {
				if (err) return reject(err)
				resolve()
			})
		})

		request.on("error", (err) => {
			fsSync.unlink(dest, (unlinkErr) => {
				if (unlinkErr) return reject(unlinkErr)
				reject(err)
			})
		})

		writeStream.on("error", (err) => {
			fsSync.unlink(dest, (unlinkErr) => {
				if (unlinkErr) return reject(unlinkErr)
				reject(err)
			})
		})
	})
}*/

async function downloadFile(url: string, dest: string) {
	const writeStream = fsSync.createWriteStream(dest)
	//https://stackoverflow.com/questions/55374755/node-js-axios-download-file-stream-and-writefile
	await coreAxios
		.get(url, {
			responseType: "stream",
		})
		.then((response) => {
			return new Promise<boolean>((resolve, reject) => {
				response.data.pipe(writeStream)

				let error: any = undefined
				writeStream.on("error", (err) => {
					error = err
					writeStream.close()
					reject(err)
				})
				writeStream.on("close", () => {
					if (!error) {
						resolve(true)
					}
					//no need to call the reject here, as it will have been called in the
					//'error' stream;
				})
			})
		})
}

export const MediaManager = Service(
	class {
		private mediaFolders: MediaFolder[] = []

		private mediaFiles = new Map<string, MediaMetadata>()

		constructor() {
			const mediaPath = resolveProjectPath("./media")
			this.setupFolderScanner("default", mediaPath)

			defineIPCFunc("media", "getMedia", () => {
				return [...this.mediaFiles.values()]
			})

			defineIPCFunc("media", "openMediaFolder", () => {
				shell.openPath(mediaPath)
			})

			defineIPCFunc("media", "exploreMediaItem", (path: string) => {
				const mediaItem = this.mediaFiles.get(path)
				if (!mediaItem) return
				shell.showItemInFolder(mediaItem.file)
			})

			defineIPCFunc("media", "downloadMedia", async (url: string, mediaPath: string) => {
				await this.downloadMedia(url, mediaPath)
			})

			defineIPCFunc("media", "copyMedia", async (localPath: string, mediaPath: string) => {
				await this.copyMedia(localPath, mediaPath)
			})

			const router = express.Router()
			router.use(express.static(mediaPath))
			WebService.getInstance().addRootRouter("/media/default", router)
		}

		getLocalPath(mediaPath: string) {
			const baseMediaPath = resolveProjectPath("./media")

			if (!mediaPath.startsWith("/default")) throw new Error("not a media path")

			const defaultPath = path.relative("/default", mediaPath)

			const localPath = path.join(baseMediaPath, defaultPath)

			return localPath
		}

		async downloadMedia(url: string, mediaPath: string) {
			try {
				const localPath = this.getLocalPath(mediaPath)

				logger.log("Downloading Media", url, "to", localPath)

				await downloadFile(url, localPath)
			} catch (err) {
				logger.error("ERROR DOWNLOADING MEDIA", err)
			}
		}

		async copyMedia(localPath: string, mediaPath: string) {
			try {
				const destPath = this.getLocalPath(mediaPath)

				logger.log("Copying Media", localPath, "to", destPath)

				await fs.copyFile(localPath, destPath)
			} catch (err) {
				logger.error("ERROR COPYING MEDIA", err)
			}
		}

		getMedia(path: string) {
			return this.mediaFiles.get(path)
		}

		private async setupFolderScanner(id: string, path: string) {
			globalLogger.log("Scanning", path, "for media")
			await ensureDirectory(path)
			const watcher = chokidar.watch(path)

			watcher.on("add", (filepath, stats) => {
				this.addMedia(id, path, filepath)
			})

			watcher.on("unlink", (filepath) => {
				this.removeMedia(id, path, filepath)
			})

			watcher.on("change", (filepath) => {
				this.addMedia(id, path, filepath)
			})

			this.mediaFolders.push({
				id,
				path,
				watcher,
			})
		}

		private async addMedia(folderId: string, root: string, filepath: string) {
			const rootRelPath = pathTools.relative(root, filepath)
			const relPath = pathTools.join(folderId, rootRelPath)
			const extension = pathTools.extname(filepath)

			const metadata: MediaMetadata = {
				folderId,
				file: filepath,
				path: relPath,
				url: "",
				name: pathTools.basename(filepath),
			}

			//Duration
			try {
				const probeInfo = await probeMedia(filepath)
				const duration = probeInfo.format.duration as number | string | undefined

				if (duration && duration != "N/A") {
					metadata.duration = Number(duration)
				}

				if (stillImageFormats.includes(extension)) {
					metadata.image = true
				} else {
					for (const s of probeInfo.streams) {
						if (s.codec_type == "audio") {
							metadata.audio = true
						}
						if (s.codec_type == "video") {
							if (metadata.duration != null) {
								metadata.video = true
							} else {
								metadata.image = true
							}
						}
					}
				}
			} catch {}
			this.mediaFiles.set(relPath, metadata)
			addOrUpdateMediaRenderer(metadata)
		}

		private async removeMedia(folderId: string, root: string, filepath: string) {
			const rootRelPath = pathTools.relative(root, filepath)
			const relPath = pathTools.join(folderId, rootRelPath)
			this.mediaFiles.delete(relPath)
			removeMediaRenderer(relPath)
		}
	}
)

export function setupMedia() {
	let ffprobePath = ""
	let ffmpegPath = ""
	if (app.isPackaged) {
		const binPath = path.join(__dirname, "../../../", "ffmpeg/bin")

		ffprobePath = path.resolve(binPath, "ffprobe.exe")
		ffmpegPath = path.resolve(binPath, "ffmpeg.exe")
	} else {
		const nodeModulesPath = path.join(__dirname, "../../../../", "node_modules")

		ffprobePath = path.resolve(nodeModulesPath, "@ffprobe-installer/win32-x64/ffprobe.exe")
		ffmpegPath = path.resolve(nodeModulesPath, "@ffmpeg-installer/win32-x64/ffmpeg.exe")
	}

	logger.log("ffmpeg path", ffmpegPath)
	logger.log("ffprobe path", ffprobePath)

	ffmpeg.setFfmpegPath(ffmpegPath)
	ffmpeg.setFfprobePath(ffprobePath)
	MediaManager.initialize()
}
