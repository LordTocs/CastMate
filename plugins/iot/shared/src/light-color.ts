import { Color, SchemaBase, registerType } from "castmate-schema"
import * as chromatism from "chromatism2"
/**
 * hsb(hue(0-360),sat(0,100), bri(0,100))
 */
export type HSB = `hsb(${number}, ${number}, ${number})`
/**
 * kb(kelvin, bri(0,100))
 */
export type KB = `kb(${number}, ${number})`

export interface HSBColor {
	hue: number
	sat: number
	bri: number
}

export interface KelvinColor {
	kelvin: number
	bri: number
}

export type LightColorObj = HSBColor | KelvinColor

export type LightColor = HSB | KB
export const LightColor = {
	factoryCreate() {
		return "hsb(0, 100, 100)"
	},
	isHSB(color: LightColor | undefined): color is HSB {
		if (!color) return false
		if (color.startsWith("hsb(") && color.endsWith(")")) {
			return true
		}
		return false
	},
	isKelvin(color: LightColor | undefined): color is KB {
		if (!color) return false
		if (color.startsWith("kb(") && color.endsWith(")")) {
			return true
		}
		return false
	},
	parse(color: LightColor): LightColorObj {
		if (!color) throw new Error("Color was falsy!")
		if (color.startsWith("hsb(") && color.endsWith(")")) {
			const contents = color.substring(4, color.length - 1)
			const [h, s, b] = contents.split(",")
			return {
				hue: Number(h),
				sat: Number(s),
				bri: Number(b),
			}
		} else if (color.startsWith("kb(") && color.endsWith(")")) {
			const contents = color.substring(3, color.length - 1)
			const [k, b] = contents.split(",")
			return {
				kelvin: Number(k),
				bri: Number(b),
			}
		}
		throw new Error(`Unknown Light Format: ${color}`)
	},
	serialize(color: LightColorObj): LightColor {
		if (!color) throw new Error("Color was falsy!")
		if ("hue" in color) {
			return `hsb(${color.hue}, ${color.sat}, ${color.bri})`
		} else {
			return `kb(${color.kelvin}, ${color.bri})`
		}
	},
	toColor(color: LightColor): Color {
		const parsed = LightColor.parse(color)

		if ("kelvin" in parsed) {
			return kelvinToCSS(parsed.kelvin, parsed.bri)
		} else {
			return chromatism.convert({ h: parsed.hue, s: parsed.sat, v: parsed.bri }).hex as Color
		}
	},
	toRGB(color: LightColor) {
		const parsed = LightColor.parse(color)
		if ("kelvin" in parsed) {
			const rgb = kelvinToRGB(parsed.kelvin ?? 4000)
			const hsv = chromatism.convert(rgb).hsv

			hsv.v = parsed.bri ?? 100

			return chromatism.convert(hsv).rgb
		} else {
			return chromatism.convert({ h: parsed.hue, s: parsed.sat, v: parsed.bri }).rgb
		}
	},
}

type LightColorFactory = typeof LightColor
export interface SchemaLightcolor extends SchemaBase<LightColor> {
	type: LightColorFactory
	template?: boolean
}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		LightColor: [SchemaLightcolor, LightColor]
	}
}

registerType("LightColor", {
	constructor: LightColor,
})

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max)
}

//https://tannerhelland.com/2012/09/18/convert-temperature-rgb-algorithm-code.html
export function kelvinToRGB(kelvin: number) {
	const temp = kelvin / 100

	const color = { r: 0, g: 0, b: 0 }

	if (temp <= 66) {
		color.r = 255
		color.g = 99.4708025861 * Math.log(temp) - 161.1195681661
	} else {
		color.r = 329.698727446 * Math.pow(temp - 60, -0.1332047592)
		color.g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492)
	}

	if (temp >= 66) {
		color.b = 255
	} else if (temp <= 19) {
		color.b = 0
	} else {
		color.b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307
	}

	color.r = clamp(color.r, 0, 255)
	color.g = clamp(color.g, 0, 255)
	color.b = clamp(color.b, 0, 255)
	return color
}

export function kelvinToCSS(kelvin: number, bri?: number): Color {
	const rgb = kelvinToRGB(kelvin ?? 4000)
	const hsv = chromatism.convert(rgb).hsv

	hsv.v = bri ?? 100

	return chromatism.convert(hsv).cssrgb as Color
}
