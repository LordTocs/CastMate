import { IPCSchema, SchemaObj } from "castmate-schema"

export interface OverlayWidgetSize {
	width: number
	height: number
}

export interface OverlayWidgetPosition {
	x: number
	y: number
}

export interface OverlayWidgetConfig {
	id: string
	plugin: string
	widget: string
	name: string
	size: OverlayWidgetSize
	position: OverlayWidgetPosition
	config: Object
	locked: boolean
	visible: boolean
}

export interface OverlayPreviewConfig {
	offsetX: number
	offsetY: number
	source?: string | "obs"
}

export interface OverlayConfig {
	name: string
	size: { width: number; height: number }
	widgets: OverlayWidgetConfig[]
	preview?: OverlayPreviewConfig
}

export interface OverlayWidgetOptions<PropSchema extends SchemaObj = SchemaObj> {
	id: string
	name: string
	description?: string
	icon?: string
	defaultSize: {
		width: number | "canvas"
		height: number | "canvas"
	}
	config: PropSchema
}

export interface IPCOverlayWidgetDescriptor {
	plugin: string
	options: {
		id: string
		name: string
		description?: string
		icon?: string
		defaultSize: {
			width: number | "canvas"
			height: number | "canvas"
		}
		config: IPCSchema
	}
}
