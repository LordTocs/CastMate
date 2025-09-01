import { SchemaBase, registerType } from "../schema"

export type MediaFile = string

type MediaFileFactory = { factoryCreate(): MediaFile }
export const MediaFile: MediaFileFactory = {
	factoryCreate() {
		return ""
	},
}

export interface SchemaMediaFile extends SchemaBase<MediaFile> {
	type: MediaFileFactory
	sound?: boolean
	image?: boolean
	video?: boolean
}

declare module "../schema" {
	interface SchemaTypeMap {
		MediaFile: [SchemaMediaFile, MediaFile]
	}
}

registerType("MediaFile", {
	constructor: MediaFile,
})

export interface MediaMetadata {
	image?: boolean
	audio?: boolean
	video?: boolean
	path: string
	file: string
	url: string
	duration?: number
	folderId: string
	name: string
}

export const stillImageFormats = [".png", ".jpg", ".jpeg", ".svg", ".bmp", ".tiff"]
export const ImageFormats = [".gif", ".png", ".jpg", ".jpeg", ".apng", ".avif", ".webp", ".svg", ".bmp", ".tiff"]
export const VideoFormats = [".mp4", ".webm", ".ogg"]
export const SoundFormats = [".mp3", ".wav", ".ogg"]

export function normalizeMediaPath(mediaPath: string) {
	const slashCorrected = mediaPath.replaceAll("\\", "/")
	return `${slashCorrected.startsWith("/") ? "" : "/"}${slashCorrected}`
}
