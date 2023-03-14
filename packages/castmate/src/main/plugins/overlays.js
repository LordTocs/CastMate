import { Overlay } from "../overlays/overlay"
import { OverlayManager } from "../overlays/overlay-manager"
import { templateNumber, template } from "../state/template"

export default {
	name: "overlays",
	uiName: "Overlay",
	icon: "mdi-picture-in-picture-top-right",
	color: "#CC63A2",
	async init() {
		OverlayManager.getInstance().registerOverlayCallable(
			"wheelLanded",
			(caller, item) => {
				this.triggers.wheelLanded({
					overlay: caller.overlay,
					wheel: caller.widget,
					item,
				})
			}
		)
	},
	triggers: {
		wheelLanded: {
			name: "Wheel Stopped",
			description: "Overlay Wheel Stopped Spinning",
			config: {
				type: Object,
				properties: {
					wheel: {
						type: "OverlayWidget",
						name: "Wheel",
						widgetType: "Wheel",
						required: true,
					},
					item: { type: String, name: "Item Name" },
				},
			},
			context: {
				overlay: { type: Overlay, name: "Overlay" },
				wheel: { type: String, name: "Wheel" },
				item: { type: String, name: "Item Name" },
			},
			handler(config, context) {
				if (
					config.wheel?.overlay !== context.overlay ||
					config.wheel?.widget !== context.wheel
				) {
					return false
				}
				if (
					config.item &&
					config.item.length > 0 &&
					config.item != context.item
				) {
					return false
				}
				return true
			},
		},
	},
	actions: {
		alert: {
			name: "Alert",
			description: "Shows an Alert in the OBS browser",
			icon: "mdi-alert-box-outline",
			color: "#CC63A2",
			data: {
				type: Object,
				properties: {
					alert: {
						type: "OverlayWidget",
						name: "Alert Box",
						widgetType: "Alert",
						required: true,
					},
					header: {
						type: String,
						area: true,
						template: true,
						name: "Header",
					},
					text: {
						type: String,
						area: true,
						template: true,
						name: "Text",
					},
					color: { type: "Color", template: true, name: "Color" },
				},
			},
			async handler(notificationData, context) {
				let notification = { ...notificationData }

				if ("header" in notification) {
					notification.header = await template(
						notificationData.header,
						context
					)
				}

				if ("text" in notification) {
					notification.text = await template(
						notificationData.text,
						context
					)
				}

				if ("color" in notification) {
					notification.color = await template(
						notificationData.color,
						context
					)
				} else {
					notification.color = this.settings.defaultColor
				}

				OverlayManager.getInstance().callOverlayFunc(
					notificationData.alert.overlay,
					notificationData.alert.widget,
					"showAlert",
					notification.header,
					notification.text,
					notification.color
				)
			},
		},
		wheelSpin: {
			name: "Spin Wheel",
			description: "Spins an Overlay Wheel",
			icon: "mdi-tire",
			color: "#CC63A2",
			data: {
				type: Object,
				properties: {
					wheel: {
						type: "OverlayWidget",
						name: "Wheel",
						widgetType: "Wheel",
						required: true,
					},
					strength: {
						type: Number,
						name: "Strength",
						required: true,
						template: true,
					},
				},
			},
			async handler(data, context) {
				const strength = await templateNumber(data.strength, context)

				await OverlayManager.getInstance().callOverlayFunc(
					data.wheel.overlay,
					data.wheel.widget,
					"spinWheel",
					strength
				)
			},
		},
	},
}
