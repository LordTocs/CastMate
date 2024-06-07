import { SchemaBase, registerType } from "castmate-schema"

export interface OverlayWidget {
	overlayId: string
	widgetId: string
}

const OverlayWidgetSymbol = Symbol()
export const OverlayWidget = {
	factoryCreate(): OverlayWidget {
		return undefined as unknown as OverlayWidget
	},
	[OverlayWidgetSymbol]: "OverlayWidget",
}

export type OverlayWidgetFactory = typeof OverlayWidget

export interface WidgetTypeId {
	plugin: string
	widget: string
}

export interface SchemaOverlayWidget extends SchemaBase<OverlayWidget> {
	type: OverlayWidgetFactory
	widgetType?: WidgetTypeId | WidgetTypeId[]
}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		OverlayWidget: [SchemaOverlayWidget, OverlayWidget]
	}
}

registerType("OverlayWidget", {
	constructor: OverlayWidget,
})
