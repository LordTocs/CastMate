import { SchemaBase, registerType } from "../schema"

type RGB = `rgb(${number}, ${number}, ${number})`
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`
type HEX = `#${string}`

export type Color = RGB | RGBA | HEX

type ColorFactory = { factoryCreate() : Color }
const Color : ColorFactory = {
	factoryCreate() {
		return "#000000" as Color
	}
}

export interface SchemaColor extends SchemaBase {
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
})
