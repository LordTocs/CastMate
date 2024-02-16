import { SchemaObj } from "castmate-schema"
import { Component, VueElement, VueElementConstructor } from "vue"

export function declareWidgetOptions<PropSchema extends SchemaObj>(opts: {
	id: string
	name: string
	description?: string
	icon?: string
	defaultSize: {
		width: number | "canvas"
		height: number | "canvas"
	}
	config: PropSchema
}) {
	return opts
}

export interface OverlayPluginOptions {
	id: string
	widgets: Component[]
}

export function definePluginOverlays(opts: OverlayPluginOptions) {
	return opts
}
