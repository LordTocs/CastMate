import { TemplateNumber, registerType } from "castmate-schema"
import { OBSBoundsType, OBSAlignment, OBSWSSourceTransform } from "./websocket-models"

export interface OBSSourceTransform {
	position: {
		x: TemplateNumber | undefined
		y: TemplateNumber | undefined
	}
	rotation: TemplateNumber | undefined
	alignment: OBSAlignment | undefined
	scale: {
		x: TemplateNumber | undefined
		y: TemplateNumber | undefined
	}
	crop: {
		top: TemplateNumber | undefined
		right: TemplateNumber | undefined
		bottom: TemplateNumber | undefined
		left: TemplateNumber | undefined
	}
	boundingBox: {
		boxType: OBSBoundsType | undefined
		alignment: OBSAlignment | undefined
		width: TemplateNumber | undefined
		height: TemplateNumber | undefined
	}
}

export interface ResolvedOBSSourceTransform {
	position: {
		x: number | undefined
		y: number | undefined
	}
	rotation: number | undefined
	alignment: OBSAlignment | undefined
	scale: {
		x: number | undefined
		y: number | undefined
	}
	crop: {
		top: number | undefined
		right: number | undefined
		bottom: number | undefined
		left: number | undefined
	}
	boundingBox: {
		boxType: OBSBoundsType | undefined
		alignment: OBSAlignment | undefined
		width: number | undefined
		height: number | undefined
	}
}

export function createEmptyOBSSourceTransform() {
	return {
		position: {
			x: undefined,
			y: undefined,
		},
		alignment: undefined,
		rotation: undefined,
		scale: {
			x: undefined,
			y: undefined,
		},
		crop: {
			top: undefined,
			right: undefined,
			bottom: undefined,
			left: undefined,
		},
		boundingBox: {
			boxType: undefined,
			alignment: undefined,
			width: undefined,
			height: undefined,
		},
	}
}
export interface SchemaOBSSourceTransform {
	type: OBSSourceTransformFactory
	template?: true
}

const obsTransformSymbol = Symbol()
export type OBSSourceTransformFactory = {
	factoryCreate(): ResolvedOBSSourceTransform
	[obsTransformSymbol]: "OBSSourceTransform"
}

export const OBSSourceTransform: OBSSourceTransformFactory = {
	factoryCreate() {
		return createEmptyOBSSourceTransform()
	},
	[obsTransformSymbol]: "OBSSourceTransform",
}

registerType("OBSSourceTransform", {
	constructor: OBSSourceTransform,
})

declare module "castmate-schema" {
	interface SchemaTypeMap {
		OBSSourceTransform: [SchemaOBSSourceTransform, ResolvedOBSSourceTransform]
	}

	interface TemplateSchemaTypeMap {
		OBSSourceTransform: [SchemaOBSSourceTransform, OBSSourceTransform]
	}
}

export function transformToOBSWS(value: ResolvedOBSSourceTransform): Partial<OBSWSSourceTransform> {
	const result: Partial<OBSWSSourceTransform> = {}

	if (value.position.x != null) {
		result.positionX = value.position.x
	}
	if (value.position.y != null) {
		result.positionY = value.position.y
	}

	if (value.rotation != null) {
		result.rotation = value.rotation
	}

	if (value.alignment != null) {
		result.alignment = value.alignment
	}

	if (value.crop.top != null) {
		result.cropTop = value.crop.top
	}

	if (value.crop.left != null) {
		result.cropLeft = value.crop.left
	}

	if (value.crop.bottom != null) {
		result.cropBottom = value.crop.bottom
	}

	if (value.crop.right != null) {
		result.cropRight = value.crop.right
	}

	if (value.boundingBox.alignment != null) {
		result.boundsAlignment = value.boundingBox.alignment
	}

	if (value.boundingBox.boxType != null) {
		result.boundsType = value.boundingBox.boxType
	}

	if (value.boundingBox.width != null) {
		result.boundsWidth = value.boundingBox.width
	}

	if (value.boundingBox.height != null) {
		result.boundsHeight = value.boundingBox.height
	}

	return result
}

export function OBSWSToTransform(value: Partial<OBSWSSourceTransform>): ResolvedOBSSourceTransform {
	const result: ResolvedOBSSourceTransform = createEmptyOBSSourceTransform()

	if (value.positionX != null) {
		result.position.x = value.positionX
	}

	if (value.positionY != null) {
		result.position.y = value.positionY
	}

	if (value.rotation != null) {
		result.rotation = value.rotation
	}

	if (value.alignment != null) {
		result.alignment = value.alignment
	}

	if (value.cropBottom != null) {
		result.crop.bottom = value.cropBottom
	}

	if (value.cropTop != null) {
		result.crop.top = value.cropTop
	}

	if (value.cropLeft != null) {
		result.crop.left = value.cropLeft
	}

	if (value.cropRight != null) {
		result.crop.right = value.cropRight
	}

	if (value.boundsAlignment != null) {
		result.boundingBox.alignment = value.alignment
	}

	if (value.boundsType != null) {
		result.boundingBox.boxType = value.boundsType
	}

	if (value.boundsHeight != null) {
		result.boundingBox.height = value.boundsHeight
	}

	if (value.boundsWidth != null) {
		result.boundingBox.width = value.boundsWidth
	}

	return result
}
