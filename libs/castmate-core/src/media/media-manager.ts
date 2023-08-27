import { Service } from "../util/service"
import { ImageFormats, MediaMetadata, stillImageFormats } from "castmate-schema"
import * as fs from "fs/promises"
import * as pathTools from "path"
import * as rra from "recursive-readdir-async"
import * as ffmpeg from "fluent-ffmpeg"
import * as chokidar from "chokidar"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { ensureDirectory, resolveProjectPath } from "../io/file-system"
//Thumbnails?
//Durations?

function getDuration(file: string) {
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
const removeMediaRenderer = defineCallableIPC<(relpath: string) => void>("media", "addMedia")

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
		}

		getMedia(path: string) {
			return this.mediaFiles.get(path)
		}

		private async setupFolderScanner(id: string, path: string) {
			console.log("Scanning", path, "for media")
			await ensureDirectory(path)
			const watcher = chokidar.watch(path)

			watcher.on("add", (filepath, stats) => {
				this.addMedia(path, filepath)
			})

			watcher.on("unlink", (filepath) => {
				this.removeMedia(path, filepath)
			})

			watcher.on("change", (filepath) => {
				this.addMedia(path, filepath)
			})

			this.mediaFolders.push({
				id,
				path,
				watcher,
			})
		}

		private async addMedia(root: string, filepath: string) {
			const relPath = pathTools.relative(root, filepath)
			const extension = pathTools.extname(filepath)

			const metadata: MediaMetadata = {
				file: filepath,
				path: relPath,
				url: "",
			}

			//Duration
			try {
				const probeInfo = await getDuration(filepath)
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

			console.log(metadata)
			this.mediaFiles.set(relPath, metadata)
			addOrUpdateMediaRenderer(metadata)
		}

		private async removeMedia(root: string, filepath: string) {
			const relPath = pathTools.relative(root, filepath)
			this.mediaFiles.delete(relPath)
			removeMediaRenderer(relPath)
		}
	}
)
