import { Service } from "../util/service"
import { ImageFormats, MediaMetadata, stillImageFormats } from "castmate-schema"
import * as fs from "fs/promises"
import path, * as pathTools from "path"
import * as rra from "recursive-readdir-async"
import * as ffmpeg from "fluent-ffmpeg"
import * as chokidar from "chokidar"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { ensureDirectory, resolveProjectPath } from "../io/file-system"
import { shell, app } from "electron"
import { globalLogger, usePluginLogger } from "../logging/logging"

//require("@ffmpeg-installer/win32-x64")
//require("@ffprobe-installer/win32-x64")
//Thumbnails?
//Durations?
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
