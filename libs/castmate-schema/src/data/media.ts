import { Defaultable, SchemaBaseOptions, Schema, S, defineSchemaType, getDefault } from "../schema/schema-base"
import { SchemaType } from "../schema/schema-typing"

export type MediaFile = string

type MediaFileFactory = { factoryCreate(): MediaFile }
export const MediaFile: MediaFileFactory = {
	factoryCreate() {
		return ""
	},
}

export interface SchemaMediaFileOptions extends SchemaBaseOptions, Defaultable<MediaFile> {
	sound?: boolean
	image?: boolean
	video?: boolean
}

export interface SchemaMediaFile extends Schema, SchemaMediaFileOptions {
	type: "MediaFile"
}

declare module "../schema/schema-base" {
	namespace S {
		function MediaFile(options?: SchemaMediaFileOptions): SchemaMediaFile
	}

	interface SchemaTypeMap {
		MediaFile: SchemaMapping<SchemaMediaFile, MediaFile>
	}
}

defineSchemaType<SchemaMediaFile>({
	type: "MediaFile",
	name: "Media File",
	color: "#000000",
	icon: "mdi mdi-media",
	traits: {
		canBeVariable: true,
	},
	async constructDefault(schema) {
		return ((await getDefault(schema)) ?? "") as SchemaType<typeof schema>
	},
})

S.MediaFile = (options) => {
	return {
		type: "MediaFile",
		...options,
	}
}

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
