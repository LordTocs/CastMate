import { OBSAlignment, OBSBlendMode, OBSBoundsType, OBSSourceType } from "castmate-plugin-obs-shared"

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