import { Color, SchemaBase, registerType } from "castmate-schema"

import { CSSProperties } from "vue"

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
	fontWeight: number
	stroke?: OverlayStrokeStyle
	shadow?: OverlayShadowStyle
}

export function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max)
}

function createCSS() {
	return {} as CSSProperties
}

export function cssProp<Key extends keyof CSSProperties, T>(
	obj: CSSProperties,
	prop: Key,
	select: T,
	func: (value: NonNullable<T>) => CSSProperties[Key]
) {
	if (select == null) return
	obj[prop] = func(select)
}

export function cssStaticProp<Key extends keyof CSSProperties>(
	obj: CSSProperties,
	prop: Key,
	select: CSSProperties[Key] | undefined | null
) {
	if (select == null) return
	obj[prop] = select
}

export type WidgetSizePixels = number

export interface WidgetSizePercent {
	unit: "%"
	amount: number
}

export type WidgetStyleSize = WidgetSizePixels | WidgetSizePercent

function isPixelSize(size: WidgetStyleSize): size is WidgetSizePixels {
	return typeof size == "number"
}

function toSizeCSS(size: WidgetStyleSize, scale: number = 1) {
	if (isPixelSize(size)) {
		return `${size}px`
	}
	return `${size.amount}${size.unit}`
}

export function createWidetSize(size: number, unit: "px" | "%" = "px") {
	return {
		unit,
		amount: size,
	} as WidgetStyleSize
}

type Numberish = string | number
type KeysMatching<T extends object, V> = {
	[K in keyof T]-?: V extends T[K] ? K : never
}[keyof T]

type NumberishCSSProperties = Pick<CSSProperties, KeysMatching<CSSProperties, Numberish>>
export function cssSizeProp<Key extends keyof NumberishCSSProperties>(
	obj: CSSProperties,
	prop: Key,
	select: WidgetStyleSize | undefined | null,
	scale: number = 1
) {
	if (select == null) return
	obj[prop] = toSizeCSS(select, scale)
}

const OverlayTextSymbol = Symbol()
export const OverlayTextStyle = {
	factoryCreate(initial?: Partial<OverlayTextStyle>): OverlayTextStyle {
		return {
			fontSize: 65,
			fontColor: "#FFFFFF",
			fontFamily: "Impact",
			fontWeight: 300,
			stroke: {
				width: 4,
				color: "#000000",
			},
			...initial,
		}
	},
	[OverlayTextSymbol]: "OverlayText",
	toCSSProperties(textStyle: OverlayTextStyle | undefined, scale: number = 1) {
		if (!textStyle) return {}

		return {
			fontSize: `${textStyle.fontSize * scale}px`,
			color: textStyle.fontColor,
			fontFamily: textStyle.fontFamily,
			fontWeight: textStyle.fontWeight,
			margin: "0",
			...(textStyle.shadow
				? {
						textShadow: `${textStyle.shadow.offsetX * scale}px ${textStyle.shadow.offsetY * scale}px ${
							textStyle.shadow.blur * scale
						}px ${textStyle.shadow.color}`,
				  }
				: {}),
			...(textStyle.stroke && textStyle.stroke.width > 0
				? {
						"-webkit-text-stroke-color": textStyle.stroke.color,
						"-webkit-text-stroke-width": `${textStyle.stroke.width * scale}px`,
				  }
				: {}),
		}
	},
}
export type OverlayTextStyleFactory = typeof OverlayTextStyle

export interface SchemaOverlayTextStyle extends SchemaBase<OverlayTextStyle> {
	type: OverlayTextStyleFactory
	template?: boolean
}

export interface OverlayEdgeInfo<T = number> {
	top: T
	bottom: T
	left: T
	right: T
}

export interface OverlayBlockStyle {
	margin: OverlayEdgeInfo
	padding: OverlayEdgeInfo
	horizontalAlign: "left" | "center" | "right"
	verticalAlign: "top" | "center" | "bottom"
}

function verticalAlignToCSS(va?: "top" | "center" | "bottom") {
	if (va == "center") {
		return "center"
	} else if (va == "bottom") {
		return "end"
	}
	return "start"
}

function horizontalAlignToCSS(ha?: "left" | "center" | "right") {
	if (ha == "center") {
		return "center"
	} else if (ha == "right") {
		return "end"
	}
	return "start"
}

const OverlayBlockSymbol = Symbol()
export const OverlayBlockStyle = {
	factoryCreate(initial?: Partial<OverlayBlockStyle>): OverlayBlockStyle {
		return {
			margin: { top: 0, bottom: 0, left: 0, right: 0 },
			padding: { top: 0, bottom: 0, left: 0, right: 0 },
			horizontalAlign: "left",
			verticalAlign: "top",
			...initial,
		}
	},
	[OverlayBlockSymbol]: "OverlayBlockStyle",
	toCSSProperties(blockStyle: OverlayBlockStyle | undefined) {
		if (!blockStyle) return {}

		return {
			display: "flex",
			marginTop: `${blockStyle.margin.top}px`,
			marginLeft: `${blockStyle.margin.left}px`,
			marginBottom: `${blockStyle.margin.bottom}px`,
			marginRight: `${blockStyle.margin.right}px`,
			paddingTop: `${blockStyle.padding.top}px`,
			paddingLeft: `${blockStyle.padding.left}px`,
			paddingBottom: `${blockStyle.padding.bottom}px`,
			paddingRight: `${blockStyle.padding.right}px`,
			justifyContent: horizontalAlignToCSS(blockStyle.horizontalAlign),
			alignItems: verticalAlignToCSS(blockStyle.verticalAlign),
		}
	},
}

export type OverlayBlockStyleFactory = typeof OverlayBlockStyle

export interface SchemaOverlayBlockStyle extends SchemaBase<OverlayBlockStyle> {
	type: OverlayBlockStyleFactory
	template?: boolean
	allowMargin?: boolean
	allowPadding?: boolean
	allowVerticalAlign?: boolean
	allowHorizontalAlign?: boolean
}

export interface OverlayTextAlignment {
	textAlign: "left" | "center" | "right" | "justify"
}

const OverlayTextAlignmentSymbol = Symbol()

export const OverlayTextAlignment = {
	factoryCreate(initial?: Partial<OverlayTextAlignment>): OverlayTextAlignment {
		return { textAlign: "left", ...initial }
	},
	toCSSProperties(style: OverlayTextAlignment | undefined) {
		if (!style) return {}

		return {
			textAlign: style.textAlign,
		}
	},
	[OverlayTextAlignmentSymbol]: "OverlayTextAlignment",
}

export type OverlayTextAlignmentFactory = typeof OverlayTextAlignment

export interface SchemaOverlayTextAlignment extends SchemaBase<OverlayTextAlignment> {
	type: OverlayTextAlignmentFactory
}

export interface WidgetCornerInfo<T = number> {
	topLeft: T
	topRight: T
	bottomLeft: T
	bottomRight: T
}

export interface WidgetCornerInfoBound<T = number> {
	topLeft: T
	topRight: T
	bottomLeft: T
	bottomRight: T
}

export function clampCornerInfo(
	style: Partial<WidgetCornerInfo<WidgetSizePixels>> | undefined,
	min: WidgetCornerInfoBound<WidgetSizePixels>,
	max: WidgetCornerInfoBound<WidgetSizePixels>
) {
	if (!style) return undefined

	const result: Partial<WidgetCornerInfo<WidgetSizePixels>> = {}

	if (style.topLeft != null) {
		result.topLeft = clamp(style.topLeft, min.topLeft, max.topLeft)
	}
	if (style.bottomLeft != null) {
		result.bottomLeft = clamp(style.bottomLeft, min.bottomLeft, max.bottomLeft)
	}
	if (style.topRight != null) {
		result.topRight = clamp(style.topRight, min.topRight, max.topRight)
	}
	if (style.bottomRight != null) {
		result.bottomRight = clamp(style.bottomRight, min.bottomRight, max.bottomRight)
	}

	return result
}

export type WidgetBorderRadius = Partial<WidgetCornerInfo<WidgetSizePixels>>

export function getBorderRadiusCSS(style: WidgetBorderRadius | undefined, scale: number = 1) {
	const result = createCSS()
	if (!style) return result

	cssSizeProp(result, "border-top-left-radius", style.topLeft, scale)
	cssSizeProp(result, "border-top-right-radius", style.topRight, scale)
	cssSizeProp(result, "border-bottom-left-radius", style.bottomLeft, scale)
	cssSizeProp(result, "border-bottom-right-radius", style.bottomRight, scale)

	return result
}

const WidgetBorderRadiusSymbol = Symbol()
export const WidgetBorderRadius = {
	factoryCreate(initial?: WidgetBorderRadius): WidgetBorderRadius {
		return { ...initial }
	},
	[WidgetBorderRadiusSymbol]: "WidgetBorderRadius",
}

export type WidgetBorderRadiusFactory = typeof WidgetBorderRadius

export interface SchemaWidgetBorderRadius extends SchemaBase<WidgetBorderRadius> {
	type: WidgetBorderRadiusFactory
}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		OverlayTextStyle: [SchemaOverlayTextStyle, OverlayTextStyle]
		OverlayBlockStyle: [SchemaOverlayBlockStyle, OverlayBlockStyle]
		OverlayTextAlignment: [SchemaOverlayTextAlignment, OverlayTextAlignment]
		WidgetBorderRadius: [SchemaWidgetBorderRadius, WidgetBorderRadius]
	}
}

registerType("OverlayTextStyle", {
	constructor: OverlayTextStyle,
})

registerType("OverlayBlockStyle", {
	constructor: OverlayBlockStyle,
})

registerType("OverlayTextAlignment", {
	constructor: OverlayTextAlignment,
})

registerType("WidgetBorderRadius", {
	constructor: WidgetBorderRadius,
})
