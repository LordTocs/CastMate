import { IoTManager, Light, Plug } from "../iot/iot-manager"
import { templateNumber } from "../state/template"



async function templateLightColor(lightColor, context) {
    const result = {...lightColor}

    const promises = []
    if ("hue" in result)
    {
        promises.push(templateNumber(result.hue, context).then((v) => result.hue = v))
    }
    if ("sat" in result)
    {
        promises.push(templateNumber(result.sat, context).then((v) => result.sat = v))
    }
    if ("bri" in result)
    {
        promises.push(templateNumber(result.bri, context).then((v) => result.bri = v))
    }
    if ("kelvin" in result)
    {
        promises.push(templateNumber(result.kelvin, context).then((v) => result.kelvin = v))
    }
    await Promise.all(promises)
    return result
}

export default {
	name: "iot",
	uiName: "Lights & IoT",
    icon: "mdi-lightbulb-on-outline",
	color: "#7F743F",
	async init() {},
	actions: {
		light: {
			name: "Light",
			description: "Set a Smart Light's Color",
			data: {
				type: Object,
				properties: {
                    light: {
						type: Light,
						template: true,
						name: "Light",
					},
					on: {
						type: "Toggle",
						name: "Switch",
						required: true,
						default: true,
						trueIcon: "mdi-lightbulb-on",
						falseIcon: "mdi-lightbulb-outline",
					},
					lightColor: {
						type: "LightColor",
						name: "Color",
                        resource: "light",
                        template: true,
					},
					duration: {
						type: Number,
						template: true,
						name: "Transition Time",
						required: true,
						default: 0.5,
					},
				},
			},
			icon: "mdi-lightbulb-on-outline",
			color: "#7F743F",
			async handler(data, context) {
				const light = IoTManager.getInstance().lights.getById(data.light)

                await light?.setLightState(data.on, await templateLightColor(data.lightColor, context), await templateNumber(data.duration, context))
			},
		},
        plug: {
            name: "Plug",
			description: "Toggle's a Smart Plug",
			data: {
				type: Object,
				properties: {
                    plug: {
						type: Plug,
						template: true,
						name: "Plug",
					},
					on: {
						type: "Toggle",
						name: "Switch",
						required: true,
						default: true,
						trueIcon: "mdi-power-plug",
						falseIcon: "mdi-power-plug-off",
					},
				},
			},
			icon: "mdi-power-plug-outline",
			color: "#7F743F",
			async handler(data, context) {
				const plug = IoTManager.getInstance().plugs.getById(data.plug)

                await plug?.setPlugState(data.on)
			},
        }
	},
}
