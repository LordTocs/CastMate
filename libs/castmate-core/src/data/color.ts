type RGB = `rgb(${number}, ${number}, ${number})`
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`
type HEX = `#${string}`

export type Color = RGB | RGBA | HEX
type ColorConstructor = { new (...args: any[]): any }
const Color: ColorConstructor = class {
	constructor() {
		throw new Error("Uh oh, Color's aren't real classes")
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
