import { defineAction } from "castmate-core"
import { OverlayWidget } from "castmate-plugin-overlays-shared"
import { OverlayWebsocketService } from "./websocket-bridge"

export function setupAlerts() {
	defineAction({
		id: "alert",
		name: "Show Alert",
		icon: "mdi mdi-alert-box-outline",
		config: {
			type: Object,
			properties: {
				alert: {
					type: OverlayWidget,
					name: "Alert Box",
					required: true,
					widgetType: { plugin: "overlays", widget: "alert" },
				},
				title: { type: String, name: "Title", template: true, required: true, default: "" },
				subtitle: { type: String, name: "Subtitle", template: true, required: true, default: "" },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await OverlayWebsocketService.getInstance().callOverlayRPC(
				config.alert.widgetId,
				"showAlert",
				config.title,
				config.subtitle
			)
		},
	})
}
