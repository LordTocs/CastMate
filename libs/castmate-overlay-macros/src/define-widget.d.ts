import { ResolvedSchemaType, Schema, SchemaObj, SchemaType } from "castmate-schema"

declare function defineOverlayWidget<PropSchema extends SchemaObj>(opts: {
	id: string
	name: string
	description?: string
	icon?: string
	defaultSize: {
		width: number | "canvas"
		height: number | "canvas"
	}
	config: PropSchema
}): ResolvedSchemaType<PropSchema>
