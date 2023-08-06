import { SchemaBase, registerType } from "../schema"

type RGB = `rgb(${number}, ${number}, ${number})`
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`
type HEX = `#${string}`

export type Color = RGB | RGBA | HEX

type ColorConstructor = { new (): RGB | RGBA | HEX }
const Color: ColorConstructor = class {
	constructor() {
		return "#000000" as RGB | RGBA | HEX
	}
}

export interface SchemaColor extends SchemaBase {
	type: ColorConstructor
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
