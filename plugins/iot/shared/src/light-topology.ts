import {
	isSchemaType,
	Schema,
	SchemaBaseOptions,
	SchemaMapping,
	S,
	defineSchemaType,
	SchemaType,
} from "castmate-schema"

export interface LightTopologyPoint {
	type: "point"
}

export interface LightTopologyStrip {
	type: "strip"
	numLights: number
}

export interface LightTopologyGrid {
	type: "grid"
	width: number
	height: number
}

export type LightTopology = LightTopologyPoint | LightTopologyStrip | LightTopologyGrid

export interface SchemaLightTopologyOptions extends SchemaBaseOptions {}
export interface SchemaLightTopology extends Schema, SchemaLightTopologyOptions {
	type: "LightTopology"
}

export function isLightTopologySchema(schema: unknown): schema is SchemaLightTopology {
	return isSchemaType(schema, "LightTopology")
}

declare module "castmate-schema" {
	namespace S {
		function LightTopology(options?: SchemaLightTopologyOptions): SchemaLightTopology
	}

	interface SchemaTypeMap {
		LightTopology: SchemaMapping<SchemaLightTopology, LightTopology>
	}
}

S.LightTopology = (options) => {
	return {
		type: "LightTopology",
		...options,
	}
}

defineSchemaType<SchemaLightTopology>({
	type: "LightTopology",
	name: "LightTopology",
	color: "#000000",
	icon: "mdi mdi-switch",
	traits: {},
	async constructDefault(schema) {
		return { type: "point" } as SchemaType<typeof schema>
	},
})
