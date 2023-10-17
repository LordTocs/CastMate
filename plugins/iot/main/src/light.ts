import { LightColor, LightConfig, LightState } from "castmate-plugin-iot-shared"
import { Resource, ResourceStorage, defineAction, definePluginResource } from "castmate-core"
import { Duration, Toggle } from "castmate-schema"

export class LightResource<
	Config extends LightConfig = LightConfig,
	State extends LightState = LightState
> extends Resource<Config, State> {
	static storage = new ResourceStorage<LightResource>("Light")

	async setLightState(color: LightColor, on: Toggle, transition: Duration) {}
}

export function setupLights() {
	definePluginResource(LightResource)

	defineAction({
		id: "light",
		name: "Change Light",
		icon: "mdi mdi-lightbulb-on-outline",
		duration: {
			dragType: "length",
			rightSlider: {
				sliderProp: "transition",
			},
		},
		config: {
			type: Object,
			properties: {
				light: { type: LightResource, name: "Light", required: true },
				on: {
					type: Toggle,
					name: "Light Switch",
					required: true,
					default: true,
					trueIcon: "mdi mdi-lightbulb-on",
					falseIcon: "mdi mdi-lightbulb-outline",
				},
				lightColor: {
					type: LightColor,
					name: "Color",
					resource: "light",
					required: true,
				},
				transition: { type: Duration, name: "Transition Time", required: true, default: 0.5 },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await config.light?.setLightState(config.lightColor, config.on, config.transition)
		},
	})
}
