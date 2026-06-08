import { Defaultable, SchemaBaseOptions, Schema, S, defineSchemaType, getDefault } from "../schema/schema-base"
import { SchemaType } from "../schema/schema-typing"

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

export interface SchemaColorOptions extends SchemaBaseOptions, Defaultable<Color> {
	alpha?: boolean
}

export interface SchemaColor extends Schema, SchemaColorOptions {
	type: "Color"
}

declare module "../schema/schema-base" {
	namespace S {
		function Color(options?: SchemaColorOptions): SchemaColor
	}

	interface SchemaTypeMap {
		Color: SchemaMapping<SchemaColor, Color>
	}
}

S.Color = (options) => {
	return {
		type: "Color",
		...options,
	}
}

defineSchemaType<SchemaColor>({
	type: "Color",
	name: "Color",
	color: "#000000",
	icon: "mdi mdi-color",
	traits: {
		canBeVariable: true,
		canBeViewerVariable: true,
	},
	async constructDefault(schema) {
		return ((await getDefault(schema)) ?? Color.factoryCreate()) as SchemaType<typeof schema>
	},
})

export function isHexColor(str: unknown): str is Color {
	if (typeof str != "string") return false
	return /^#(?:(?:[A-F0-9]{2}){3,4}|[A-F0-9]{3})$/i.test(str)
}
