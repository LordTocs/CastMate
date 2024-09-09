import { SchemaBase, registerType } from "../schema"

type RGB = `rgb(${number}, ${number}, ${number})`
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`
type HEX = `#${string}`

export type Color = RGB | RGBA | HEX

type ColorFactory = { factoryCreate(): Color }
export const Color: ColorFactory = {
	factoryCreate() {
		return "#000000" as Color
	},
}

export interface SchemaColor extends SchemaBase<Color> {
	type: ColorFactory
	template?: boolean
	enum: Color[]
}

declare module "../schema" {
	interface SchemaTypeMap {
		Color: [SchemaColor, Color]
	}
}

registerType("Color", {
	constructor: Color,
	canBeVariable: true,
	canBeViewerVariable: true,
})

export function isHexColor(str: string): str is Color {
	return /^#(?:(?:[A-F0-9]{2}){3,4}|[A-F0-9]{3})$/i.test(str)
}
