import { SchemaObj } from "castmate-schema"
import { Component, VueElement, VueElementConstructor } from "vue"
import { OverlayWidgetOptions } from "castmate-plugin-overlays-shared"

export function declareWidgetOptions<PropSchema extends SchemaObj>(opts: OverlayWidgetOptions<PropSchema>) {
	return opts
}

export type OverlayWidgetComponent = Component & { widget: OverlayWidgetOptions }

export interface OverlayPluginOptions {
	id: string
	widgets: OverlayWidgetComponent[]
}

export function definePluginOverlays(opts: { id: string; widgets: Component[] }) {
	return opts as OverlayPluginOptions
}
