import { Color, SchemaBase, registerType } from "castmate-schema"
import _cloneDeep from "lodash/cloneDeep"

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

//Backgrounds////////////////////////////

export interface WidgetGradientStop {
	color: Color
	position: number
}

export function getGradientStopCSS(stop: WidgetGradientStop) {
	return `${stop.color} ${stop.position * 100}%`
}

export interface WidgetGradientStyle {
	gradientType: "linear" | "radial"
	angle: number
	stops: WidgetGradientStop[]
}

export function getGradientCSS(gradient: WidgetGradientStyle) {
	if (gradient.gradientType == "linear") {
		return `linear-gradient(${(gradient.angle ?? 0) + 90}deg, ${gradient.stops
			.map((s) => getGradientStopCSS(s))
			.join(", ")})`
	} else {
		return `radial-gradient(${gradient.stops.map((s) => getGradientStopCSS(s)).join(", ")})`
	}
}

export type WidgetBackgroundRepeat = "repeat" | "no-repeat"
export type WidgetBackgroundPositionH = "left" | "center" | "right"
export type WidgetBackgroundPositionV = "top" | "center" | "bottom"
export type WidgetBackgroundSizeOptions = "contain" | "cover"

interface WidgetBackgroundDimensions<H, V = H> {
	horizontal: H
	vertical: V
}

export interface WidgetBackgroundSettings {
	repeat?: WidgetBackgroundDimensions<WidgetBackgroundRepeat>
	position?: WidgetBackgroundDimensions<WidgetBackgroundPositionH, WidgetBackgroundPositionV>
	size?: WidgetBackgroundDimensions<WidgetSizePixels> | WidgetBackgroundSizeOptions
}

export function getBackgroundSettingsCSS(style: WidgetBackgroundSettings | undefined, scale: number = 1) {
	if (!style) return ""

	let result = ""

	if (style.position) {
		result += `${style.position.horizontal} ${style.position.vertical} `
	}

	if (style.size) {
		if (style.position) {
			result += "/ "
		}

		if (typeof style.size == "object") {
			result += `${toSizeCSS(style.size.horizontal, scale)} ${toSizeCSS(style.size.vertical, scale)} `
		} else if (style.size) {
			result += `${style.size} `
		}
	}

	if (style.repeat) {
		result += `${style.repeat.horizontal} ${style.repeat.vertical} `
	}

	return result
}

export interface WidgetBackgroundImage extends WidgetBackgroundSettings {
	image: string
}

export function isWidgetBackgroundImage(value: unknown): value is WidgetBackgroundImage {
	return value != null && typeof value == "object" && "image" in value
}

export interface WidgetBackgroundGradient extends WidgetBackgroundSettings {
	gradient: WidgetGradientStyle
}

export function isWidgetBackgroundGradient(value: unknown): value is WidgetBackgroundGradient {
	return value != null && typeof value == "object" && "gradient" in value
}

export type WidgetBackgroundStyleElement = WidgetBackgroundGradient | WidgetBackgroundImage

export interface WidgetBackgroundStyle {
	color?: Color
	elements: WidgetBackgroundStyleElement[]
}

export function getBackgroundCSS(
	style: WidgetBackgroundStyle | undefined,
	resolver: (media: string) => string,
	scale: number = 1
) {
	const result = createCSS()
	if (!style) return result

	result.background = style.elements
		.map((bg, index) => {
			if (!bg) {
			} else if ("image" in bg) {
				//TODO: RESOLVE
				return `${getBackgroundSettingsCSS(bg, scale)}url("${resolver(bg.image)}")`
			} else if ("gradient" in bg) {
				return `${getBackgroundSettingsCSS(bg, scale)}${getGradientCSS(bg.gradient)}`
			}
		})
		.join(",")

	if (style.color) {
		result.background += ` ${style.color}`
	}

	console.log("Background CSS", result.background)

	return result
}

const WidgetBackgroundStyleSymbol = Symbol()
export const WidgetBackgroundStyle = {
	factoryCreate(initial?: WidgetBackgroundStyle): WidgetBackgroundStyle {
		return initial ? _cloneDeep(initial) : { elements: [] }
	},
	[WidgetBackgroundStyleSymbol]: "WidgetBackgroundStyle",
}

export type WidgetBackgroundStyleFactory = typeof WidgetBackgroundStyle

export interface SchemaWidgetBackgroundStyle extends SchemaBase<WidgetBackgroundStyle> {
	type: WidgetBackgroundStyleFactory
}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		OverlayTextStyle: [SchemaOverlayTextStyle, OverlayTextStyle]
		OverlayBlockStyle: [SchemaOverlayBlockStyle, OverlayBlockStyle]
		OverlayTextAlignment: [SchemaOverlayTextAlignment, OverlayTextAlignment]
		WidgetBorderRadius: [SchemaWidgetBorderRadius, WidgetBorderRadius]
		WidgetBackgroundStyle: [SchemaWidgetBackgroundStyle, WidgetBackgroundStyle]
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

registerType("WidgetBackgroundStyle", {
	constructor: WidgetBackgroundStyle,
})
