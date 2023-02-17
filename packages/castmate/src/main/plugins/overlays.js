import { Overlay } from "../overlays/overlay";
import { OverlayManager } from "../overlays/overlay-manager";
import { templateNumber } from "../state/template";

export default {
    name: "overlays",
    uiName: "Overlays",
    icon: "",
    color: "#CC63A2",
    async init() {
        OverlayManager.getInstance().registerOverlayCallable("wheelLanded", (caller, item) => {
            this.triggers.wheelLanded({ 
                overlay: caller.overlay,
                wheel: caller.widget,
                item
            })
        })
    },
    triggers: {
        wheelLanded: {
            name: "Wheel Stopped",
            description: "Overlay Wheel Stopped Spinning",
            config: {
                type: Object,
                properties: {
                    overlay: { type: Overlay, name: "Overlay" },
                    wheel: { 
                        type: String, 
                        name: 'Wheel',
                        required: true,
                        async enum({ overlay }) {
                            const overlayObj = OverlayManager.getInstance().getById(overlay)
                            if (!overlayObj)
                                return []
                            return overlayObj.config.widgets.filter(w => w.type == 'Wheel').map(w => ({ name: w.name, value: w.id} ))
                        },
                    },
                    item: { type: String, name: "Item Name" }
                }
            },
            context: {
                overlay: { type: Overlay, name: "Overlay" },
                wheel: { type: String, name: "Wheel" },
                item: { type: String, name: "Item Name" },
            },
            handler(config, context) {
                if (config.overlay !== context.overlay || config.wheel !== context.wheel) {
                    return false;
                }
                if (config.item && config.item.length > 0 && config.item != context.item) {
                    return false;
                }
                return true;
            }
        }
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
					overlay: { type: Overlay, name: "Overlay" },
					alertBox: { 
						type: String, 
						name: 'Alert Box',
						required: true,
						async enum({ overlay }) {
							const overlayObj = OverlayManager.getInstance().getById(overlay)
							if (!overlayObj)
								return []
							return overlayObj.config.widgets.filter(w => w.type == 'Alert').map(w => ({ name: w.name, value: w.id} ))
						},
					},
					header: { type: String, template: true, name: "Header" },
					text: { type: String, template: true, name: "Text" },
					color: { type: String, template: true, name: "Color" },
				}
			},
			async handler(notificationData, context)
			{
				let notification = { ...notificationData };

				if ("header" in notification)
				{
					notification.header = await template(notificationData.header, context);
				}

				if ("text" in notification)
				{
					notification.text = await template(notificationData.text, context);
				}

				if ("color" in notification)
				{
					notification.color = await template(notificationData.color, context);
				}
				else
				{
					notification.color = this.settings.defaultColor;
				}

				OverlayManager.getInstance().callOverlayFunc(notificationData.overlay, notificationData.alertBox, 'showAlert', notification.header, notification.text, notification.color)
			}
		},
        wheelSpin: {
            name: "Spin Wheel",
			description: "Spins an Overlay Wheel",
			icon: "mdi-tire",
			color: "#CC63A2",
            data: {
                type: Object,
                properties: {
                    overlay: { type: Overlay, name: "Overlay" },
                    wheel: { 
                        type: String, 
                        name: 'Wheel',
                        required: true,
                        async enum({ overlay }) {
                            const overlayObj = OverlayManager.getInstance().getById(overlay)
                            if (!overlayObj)
                                return []
                            return overlayObj.config.widgets.filter(w => w.type == 'Wheel').map(w => ({ name: w.name, value: w.id} ))
                        },
                    },
                    strength: {
                        type: Number,
                        name: "Strength",
                        required: true,
                        template: true,
                    }
                }
            },
            async handler(data, context) {
                const strength = await templateNumber(data.strength, context);

                await OverlayManager.getInstance().callOverlayFunc(data.overlay, data.wheel, 'spinWheel', strength)
            }
        }
    }
}