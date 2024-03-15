import { useOverlayWidgets } from "castmate-overlay-widget-loader"
import { IPCOverlayWidgetDescriptor } from "castmate-plugin-overlays-shared"
import { ipcConvertSchema, useIpcCaller } from "castmate-ui-core"

export function sendOverlaysToMain() {
	const setWidgets = useIpcCaller<(widgets: IPCOverlayWidgetDescriptor[]) => any>("overlays", "setWidgets")
	const widgets = useOverlayWidgets()

	const overlayWidgets = widgets.widgets.map((w) => {
		const plugin = w.plugin
		const widgetOpts = w.component.widget
		const ipcType: IPCOverlayWidgetDescriptor = {
			plugin,
			options: {
				id: widgetOpts.id,
				name: widgetOpts.name,
				description: widgetOpts.description,
				icon: widgetOpts.icon,
				defaultSize: widgetOpts.defaultSize,
				config: ipcConvertSchema(widgetOpts.config, `renderer_overlays_${plugin}_${widgetOpts.id}`),
			},
		}
		return ipcType
	})

	setWidgets(overlayWidgets)
}
