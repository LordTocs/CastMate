export type OBSSourceType = "OBS_SOURCE_TYPE_INPUT" | "OBS_SOURCE_TYPE_FILTER"

export type OBSBoundsType =
	| "OBS_BOUNDS_NONE"
	| "OBS_BOUNDS_STRETCH"
	| "OBS_BOUNDS_SCALE_INNER"
	| "OBS_BOUNDS_SCALE_OUTER"
	| "OBS_BOUNDS_SCALE_TO_WIDTH"
	| "OBS_BOUNDS_SCALE_TO_HEIGHT"
	| "OBS_BOUNDS_MAX_ONLY"

//https://github.com/obsproject/obs-studio/blob/5dda04ad5ee8733cf5b3073d8906f080647a9139/libobs/obs.h#L132
export type OBSBlendMode =
	| "OBS_BLEND_NORMAL"
	| "OBS_BLEND_ADDITIVE"
	| "OBS_BLEND_SUBTRACT"
	| "OBS_BLEND_SCREEN"
	| "OBS_BLEND_MULTIPLY"
	| "OBS_BLEND_LIGHTEN"
	| "OBS_BLEND_DARKEN"

export enum OBSAlignment {
	OBS_ALIGN_CENTER = 0,
	OBS_ALIGN_LEFT = 1,
	OBS_ALIGN_RIGHT = 2,
	OBS_ALIGN_TOP = 4,
	OBS_ALIGN_BOTTOM = 8,
	OBS_ALIGN_TOP_LEFT = 5,
	OBS_ALIGN_TOP_RIGHT = 6,
	OBS_ALIGN_BOTTOM_LEFT = 9,
	OBS_ALIGN_BOTTOM_RIGHT = 10,
}

export interface OBSSourceTransform {
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
		boxType: OBSBoundsType
		alignment: OBSAlignment //TODO: Enum ?? // See https://github.com/obsproject/obs-studio/blob/master/libobs/obs-defs.h
	}
}

export interface OBSConnectionConfig {
	name: string
	host: string
	port: number
	password?: string
}

export interface OBSConnectionState {
	connected: boolean
	scene: string
	streaming: boolean
	recording: boolean
	replayBuffering: boolean
	virtualCamming: boolean
}

export interface OBSSceneItem {
	id: number
	index: number
	sourceName: string
	transform: OBSSourceTransform
}

export interface OBSScene {
	name: string //Scenes are identified by their name, it is unique
	sceneItems: OBSSceneItem[]
}
