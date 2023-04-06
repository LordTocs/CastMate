import { BaseSchemaDesc } from "./schema"

interface HSLColor {
	h: number
	s: number
	l: number
}

type RGB = `rgb(${number}, ${number}, ${number})`
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`
type HEX = `#${string}`

export type Color = RGB | RGBA | HEX

export interface ColorSchemaDesc extends BaseSchemaDesc {
	template: Boolean
}

declare module "./schema" {
	interface SchemaTypeMap {
		Color: [Color, ColorSchemaDesc]
	}
}
