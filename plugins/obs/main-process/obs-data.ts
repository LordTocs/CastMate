import { registerType } from "castmate-schema"

export class SourceTransform {}
export interface SourceTransform {
	position: {
		x: number
		y: number
	}
	width: number
	height: number
	rotation: number
	scale: {
		x: number
		y: number
	}
	crop: {
		top: number
		right: number
		bottom: number
		left: number
	}
	boundingBox: {
		boxType:
			| "OBS_BOUNDS_NONE"
			| "OBS_BOUNDS_STRETCH"
			| "OBS_BOUNDS_SCALE_INNER"
			| "OBS_BOUNDS_SCALE_OUTER"
			| "OBS_BOUNDS_SCALE_TO_WIDTH"
			| "OBS_BOUNDS_SCALE_TO_HEIGHT"
			| "OBS_BOUNDS_MAX_ONLY"
		alignment: 5 | 4 | 6 | 1 | 0 | 2 | 9 | 8 | 10 //TODO: Enum ?? // See https://github.com/obsproject/obs-studio/blob/master/libobs/obs-defs.h
	}
}

export interface SchemaSourceTransform {
	type: SourceTransform
}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		SourceTransform: [SchemaSourceTransform, SourceTransform]
	}
}

registerType("SourceTransform", {
	constructor: SourceTransform,
})
