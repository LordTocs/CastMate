import { Service } from "../util/service"
import { ImageFormats, MediaMetadata, normalizeMediaPath, stillImageFormats } from "castmate-schema"
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
import express, { Application, NextFunction, Request, Response, response, Router } from "express"
import { coreAxios } from "../util/request-utils"
//require("@ffmpeg-installer/win32-x64")
//require("@ffprobe-installer/win32-x64")
//Thumbnails?
//Durations?

const logger = usePluginLogger("media")

export function probeMedia(file: string) {
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

export function expressLogging(req: Request, res: Response, next: NextFunction) {
	//if (process.env.DEBUG_BUILD) {
	logger.log("MEDIA REQUEST", req.method, req.url, req.body, req.headers)
	//}
	next()
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

			defineIPCFunc("media", "validateRemoteMediaPath", async (mediaPath: string) => {
				return await this.validateRemoteMediaPath(mediaPath)
			})

			const router = express.Router()
			router.use(expressLogging)
			router.use(express.static(mediaPath))
			WebService.getInstance().addRootRouter("/media/default", router)

			//TODO: Move somewhere better
			const ttsRouter = express.Router()
			ttsRouter.use(express.static(path.join(app.getPath("temp"), "castmate-tts")))
			WebService.getInstance().addRootRouter("/media/tts-cache", ttsRouter)
		}

		async validateRemoteMediaPath(mediaPath: string) {
			try {
				const realFile = await fs.realpath(mediaPath)

				const tempFolder = await fs.realpath(path.join(app.getPath("temp"), "castmate-tts"))
				const mediaFolder = await fs.realpath(resolveProjectPath("./media"))

				if (realFile.indexOf(tempFolder) == 0) {
					return realFile
				}
				if (realFile.indexOf(mediaFolder) == 0) {
					return realFile
				}
				return undefined
			} catch (err) {
				//Special case, could be TTS generated file in the temp path
				return undefined
			}
		}

		async isTTSPath(mediaPath: string) {
			try {
				const realFile = await fs.realpath(mediaPath)
				const tempFolder = await fs.realpath(path.join(app.getPath("temp"), "castmate-tts"))
				if (realFile.indexOf(tempFolder) == 0) {
					return path.relative(tempFolder, realFile)
				}
			} catch (err) {}
			return false
		}

		isMediaPath(mediaPath: string) {
			return mediaPath.startsWith("/default")
		}

		async isMediaFolderPath(mediaPath: string) {
			try {
				const realFile = await fs.realpath(mediaPath)
				const mediaFolder = await fs.realpath(resolveProjectPath("./media"))
				if (realFile.indexOf(mediaFolder) == 0) {
					return path.relative(mediaFolder, realFile)
				}
			} catch (err) {}
			return false
		}

		getLocalPath(mediaPath: string) {
			const baseMediaPath = resolveProjectPath("./media")

			if (!this.isMediaPath(mediaPath)) throw new Error(`"${mediaPath}" not a media path`)

			const defaultPath = path.relative("/default", mediaPath)

			const localPath = path.join(baseMediaPath, defaultPath)

			console.log(mediaPath, baseMediaPath, defaultPath, localPath)

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
			return this.mediaFiles.get(normalizeMediaPath(path))
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
			const normPath = normalizeMediaPath(relPath)
			const extension = pathTools.extname(filepath)

			const metadata: MediaMetadata = {
				folderId,
				file: filepath,
				path: normPath,
				url: "",
				name: pathTools.basename(filepath),
			}

			logger.log("New Media", rootRelPath, metadata)

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
			this.mediaFiles.set(normPath, metadata)
			addOrUpdateMediaRenderer(metadata)
		}

		private async removeMedia(folderId: string, root: string, filepath: string) {
			const rootRelPath = pathTools.relative(root, filepath)
			const relPath = pathTools.join(folderId, rootRelPath)
			const normPath = normalizeMediaPath(relPath)

			const mediafile = this.mediaFiles.get(normPath)
			if (!mediafile) {
				logger.log("Unable to find media for", normPath)
			} else {
				this.mediaFiles.delete(mediafile.path)
				removeMediaRenderer(mediafile.path)
			}
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
