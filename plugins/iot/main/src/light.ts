import { LightColor, LightConfig, LightState } from "castmate-plugin-iot-shared"
import {
	Resource,
	ResourceStorage,
	abortableSleep,
	defineAction,
	definePluginResource,
	registerSchemaTemplate,
	template,
} from "castmate-core"
import { Duration, Toggle } from "castmate-schema"

export class LightResource<
	Config extends LightConfig = LightConfig,
	State extends LightState = LightState
> extends Resource<Config, State> {
	static storage = new ResourceStorage<LightResource>("Light")

	async setLightState(color: LightColor | undefined, on: Toggle, transition: Duration) {}
}

export class PollingLight<
	Config extends LightConfig = LightConfig,
	State extends LightState = LightState
> extends LightResource<Config, State> {
	poller: NodeJS.Timer | undefined = undefined

	startPolling(interval: number) {
		this.stopPolling()
		this.poller = setInterval(async () => {
			try {
				this.poll()
			} catch (err) {}
		}, interval * 1000)
	}

	stopPolling() {
		//@ts-expect-error
		clearInterval(this.poller)
		this.poller = undefined
	}

	async poll() {}
}

registerSchemaTemplate(LightColor, async (value, context, schema) => {
	return (await template(value, context)) as LightColor
})

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
					template: true,
				},
				transition: { type: Duration, name: "Transition Time", required: true, default: 0.5 },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await Promise.allSettled([
				config.light?.setLightState(config.lightColor, config.on, config.transition),
				await abortableSleep(config.transition * 1000, abortSignal),
			])
		},
	})
}
