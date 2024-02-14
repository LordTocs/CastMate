export interface OverlayWidgetSize {
	width: number
	height: number
}

export interface OverlayWidgetPosition {
	width: number
	height: number
}

export interface OverlayWidgetConfig {
	id: string
	widget: string
	name: string
	size: OverlayWidgetSize
	position: OverlayWidgetPosition
	config: Object
}

export interface OverlayConfig {
	name: string
	size: { width: number; height: number }
	widgets: OverlayWidgetConfig[]
}
