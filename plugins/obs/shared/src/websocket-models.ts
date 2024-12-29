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

export interface OBSWSSourceTransform {
	alignment: OBSAlignment
	boundsAlignment: OBSAlignment
	boundsHeight: number
	boundsType: OBSBoundsType
	boundsWidth: number
	cropBottom: number
	cropLeft: number
	cropRight: number
	cropTop: number
	height: number
	positionX: number
	positionY: number
	rotation: number
	scaleX: number
	scaleY: number
	sourceHeight: number
	sourceWidth: number
	width: number
}

export interface OBSWSSceneItem {
	inputKind: string
	isGroup: null
	sceneItemBlendMode: OBSBlendMode
	sceneItemEnabled: boolean
	sceneItemId: number
	sceneItemIndex: number
	sceneItemLocked: boolean
	sceneItemTransform: OBSWSSourceTransform
	sourceName: string
	sourceType: OBSSourceType
}

export interface OBSWSInput {
	inputKind: string
	inputName: string
	unversionedInputKind: string
}

export interface OBSWSFilter {
	filterEnabled: boolean
	filterIndex: number
	filterKind: string
	filterName: string
	filterSettings: Record<string, any>
}

export interface OBSSceneListItem {
	sceneIndex: number
	sceneName: string
}

export interface OBSWSMediaStatus {
	mediaState:
		| "OBS_MEDIA_STATE_NONE"
		| "OBS_MEDIA_STATE_PLAYING"
		| "OBS_MEDIA_STATE_OPENING"
		| "OBS_MEDIA_STATE_BUFFERING"
		| "OBS_MEDIA_STATE_PAUSED"
		| "OBS_MEDIA_STATE_STOPPED"
		| "OBS_MEDIA_STATE_ENDED"
		| "OBS_MEDIA_STATE_ERROR"
	/** Milliseconds */
	mediaDuration: number | null
	/** Milliseconds */
	mediaCursor: number | null
}

export interface OBSPropertyBool {
	type: "Bool"
	name: string
	description: string
}

export interface OBSPropertyInt {
	type: "Int"
	name: string
	description?: string
	min: number
	max: number
	step: number
}

export interface OBSPropertyFloat {
	type: "Float"
	name: string
	description?: string
	min: number
	max: number
	step: number
}

export interface OBSPropertyIntSlider {
	type: "IntSlider"
	name: string
	description?: string
	min: number
	max: number
	step: number
}

export enum OBSPropertyTextType {
	default,
	password,
	multiline,
	info,
}

export interface OBSPropertyText {
	type: "Text"
	name: string
	description?: string
	textType: OBSPropertyTextType
}

export enum OBSPropertyPathType {
	file,
	fileSave,
	directory,
}

export interface OBSPropertyPath {
	type: "Path"
	name: string
	description?: string
	pathType: OBSPropertyPathType
	filter?: string
	defaultPath?: string
}

export enum OBSPropertyListType {
	editable,
	list,
	radio,
}

export enum OBSPropertyListFormat {
	int,
	float,
	string,
	bool,
}

export interface OBSPropertyList {
	type: "List"
	name: string
	description?: string
	listType: OBSPropertyListType
	format: OBSPropertyListFormat
}

export interface OBSPropertyColor {
	type: "Color"
	name: string
	description?: string
}

export interface OBSPropertyButton {
	type: "Button"
	name: string
	text: string
}

export interface OBSPropertyFont {
	type: "Font"
	name: string
	description?: string
}

export enum OBSPropertyGroupType {
	normal,
	checkable,
}

export interface OBSPropertyGroup {
	type: "Group"
	name: string
	description?: string
	groupType: OBSPropertyGroupType
	subProps: OBSPropertyFormat
}

export type OBSProperty =
	| OBSPropertyBool
	| OBSPropertyInt
	| OBSPropertyFloat
	| OBSPropertyIntSlider
	| OBSPropertyText
	| OBSPropertyPath
	| OBSPropertyList
	| OBSPropertyColor
	| OBSPropertyButton
	| OBSPropertyFont
	| OBSPropertyGroup

export type OBSPropertyFormat = {
	[key: string]: OBSProperty
}
