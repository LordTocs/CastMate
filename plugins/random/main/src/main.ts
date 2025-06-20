import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	defineFlowAction,
	usePluginLogger,
} from "castmate-core"
import { OverlayWebsocketService, handleWidgetRPC } from "castmate-plugin-overlays-main"
import { OverlayWidget } from "castmate-plugin-overlays-shared"
export default definePlugin(
	{
		id: "random",
		name: "Random",
		description: "Randomness",
		icon: "mdi mdi-dice-multiple",
		color: "#EFCC3E",
	},
	() => {
		const logger = usePluginLogger()

		defineFlowAction({
			id: "random",
			name: "Random",
			icon: "mdi mdi-dice-multiple",
			config: {
				type: Object,
				properties: {},
			},
			flowConfig: {
				type: Object,
				properties: {
					weight: { type: Number, name: "Weight", required: true, default: 1 },
				},
			},
			async invoke(config, flows, contextData, abortSignal) {
				let weightTotal = 0
				for (const [key, flow] of Object.entries(flows)) {
					weightTotal += flow.weight
				}

				//console.log("Random Weight Total", weightTotal)

				let targetWeight = Math.random() * weightTotal

				//console.log("Random Target Weight", targetWeight)

				for (const [key, flow] of Object.entries(flows)) {
					targetWeight -= flow.weight

					//console.log("   ", targetWeight)

					if (targetWeight <= 0) {
						//console.log("Random", key)
						return key
					}
				}

				return ""
			},
		})

		defineAction({
			id: "spinWheel",
			name: "Spin Wheel",
			description: "Spins a wheel in an overlay",
			icon: "mdi mdi-tire",
			config: {
				type: Object,
				properties: {
					widget: {
						type: OverlayWidget,
						required: true,
						name: "Wheel",
						widgetType: { plugin: "random", widget: "wheel" },
					},
					strength: {
						type: Number,
						required: true,
						template: true,
						name: "Strength",
						default: 1,
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				await OverlayWebsocketService.getInstance().callOverlayRPC(
					config.widget.widgetId,
					"spinWheel",
					config.strength
				)
			},
		})

		const wheelLanded = defineTrigger({
			id: "wheelLanded",
			name: "Wheel Stopped",
			description: "Triggers when an overlay wheel has stopped!",
			config: {
				type: Object,
				properties: {
					wheel: {
						type: OverlayWidget,
						required: true,
						name: "Wheel",
						widgetType: { plugin: "random", widget: "wheel" },
					},
					item: {
						type: String,
						name: "Item Name",
					},
				},
			},
			context: {
				type: Object,
				properties: {
					wheel: {
						type: OverlayWidget,
						required: true,
						name: "Wheel",
						widgetType: { plugin: "random", widget: "wheel" },
						view: false,
					},
					item: { type: String, required: true },
				},
			},
			async handle(config, context, mapping) {
				if (config.wheel.overlayId != context.wheel.overlayId) return false
				if (config.wheel.widgetId != context.wheel.widgetId) return false

				if (config.item != null) {
					if (context.item != config.item) {
						return false
					}
				}

				return true
			},
		})

		handleWidgetRPC("wheelLanded", (overlay, widgetId, item: string) => {
			logger.log("wheelLanded", widgetId, item)
			wheelLanded({
				wheel: { overlayId: overlay.id, widgetId },
				item,
			})
		})
	}
)
