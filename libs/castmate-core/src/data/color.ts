type RGB = `rgb(${number}, ${number}, ${number})`
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`
type HEX = `#${string}`

export type Color = RGB | RGBA | HEX
type ColorConstructor = { new (...args: any[]): any }
const Color: ColorConstructor = class {
	constructor() {
		return "#000000"
	}
}

export interface SchemaColor {
	type: ColorConstructor
	template?: boolean
	enum: Color[]
}

declare module "./schema" {
	interface SchemaTypeMap {
		Color: [SchemaColor, Color]
	}
}
