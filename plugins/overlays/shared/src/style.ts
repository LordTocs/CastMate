import { Color, SchemaBase, registerType } from "castmate-schema"

export interface OverlayStrokeStyle {
	width: number
	color: Color
}

export interface OverlayShadowStyle {
	offsetX: number
	offsetY: number
	blur: number
	color: Color
}

export interface OverlayTextStyle {
	fontSize: number
	fontColor: Color
	fontFamily: string
	fontWeight: 300
	stroke?: OverlayStrokeStyle
	shadow?: OverlayShadowStyle
}

const OverlayTextSymbol = Symbol()
export const OverlayTextStyle = {
	factoryCreate(): OverlayTextStyle {
		return {
			fontSize: 10,
			fontColor: "#FFFFFF",
			fontFamily: "Arial",
			fontWeight: 300,
		}
	},
	[OverlayTextSymbol]: "OverlayText",
	toCSSProperties(textStyle: OverlayTextStyle | undefined) {
		if (!textStyle) return {}

		return {
			fontSize: `${textStyle.fontSize}px`,
			color: textStyle.fontColor,
			fontFamily: textStyle.fontFamily,
			fontWeight: textStyle.fontWeight,
			margin: "0",
		}
	},
}
export type OverlayTextStyleFactory = typeof OverlayTextStyle

export interface SchemaOverlayTextStyle extends SchemaBase<OverlayTextStyle> {
	type: OverlayTextStyleFactory
	template?: boolean
}

export interface OverlayEdgeInfo<T = number> {
	top: T | undefined
	bottom: T | undefined
	left: T | undefined
	right: T | undefined
}

export interface OverlayBlockStyle {
	margin: OverlayEdgeInfo
	padding: OverlayEdgeInfo
}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		OverlayTextStyle: [SchemaOverlayTextStyle, OverlayTextStyle]
	}
}

registerType("OverlayTextStyle", {
	constructor: OverlayTextStyle,
})
