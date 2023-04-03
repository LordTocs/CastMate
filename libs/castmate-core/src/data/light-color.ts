import { BaseSchemaDesc, SchemaProp } from "./schema"

export interface LightColor {
	hue?: number
	sat?: number
	bri?: number
}

export interface LightColorSchemaDesc extends BaseSchemaDesc {
	template: Boolean
}

declare module "./schema" {
	interface SchemaTypeMap {
		LightColor: [LightColor, LightColorSchemaDesc]
	}
}
