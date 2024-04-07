import { abortableSleep, defineAction } from "castmate-core"
import { OverlayWidget } from "castmate-plugin-overlays-shared"
import { OverlayWebsocketService } from "./websocket-bridge"
import { Duration } from "castmate-schema"
import { Overlay } from "./overlay-resource"

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
			const overlay = Overlay.storage.getById(config.alert.overlayId)
			const alertConfig = overlay?.getWidgetConfig(config.alert.widgetId)

			if (!alertConfig) return

			const mediaArray = (alertConfig.config as { media: { weight: number; duration: Duration }[] })?.media ?? []

			let weightTotal = 0

			for (const mediaOption of mediaArray) {
				weightTotal += mediaOption.weight
			}

			let idx = 0
			let targetWeight = Math.random() * weightTotal
			for (let i = 0; i < mediaArray.length; ++i) {
				const mediaOption = mediaArray[i]
				targetWeight -= mediaOption.weight
				if (targetWeight <= 0) {
					idx = i
					break
				}
			}

			const selectedMedia = mediaArray[idx]

			if (!selectedMedia) return

			await OverlayWebsocketService.getInstance().callOverlayRPC<
				(title: string, subtitle: string, mediaIdx: number) => Duration
			>(config.alert.widgetId, "showAlert", config.title, config.subtitle, idx)

			await abortableSleep(selectedMedia.duration * 1000, abortSignal)
		},
	})
}
