import { LightColor, LightConfig, LightState } from "castmate-plugin-iot-shared"
import {
	Resource,
	ResourceStorage,
	SatelliteResources,
	SatelliteService,
	abortableSleep,
	defineAction,
	definePluginResource,
	defineSatelliteResourceSlotHandler,
	registerSchemaTemplate,
	template,
} from "castmate-core"
import { Duration, Toggle } from "castmate-schema"
import { SatelliteResourceSymbol } from "castmate-core"

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

export class SatelliteLight extends LightResource {
	static [SatelliteResourceSymbol] = true

	constructor() {
		super()
		this._config = {
			name: "",
			provider: "satellite",
			providerId: "",
			rgb: {
				available: true,
			},
			kelvin: {
				available: true,
			},
			dimming: {
				available: true,
			},
			transitions: {
				available: true,
			},
		}

		this.state = {
			on: true,
			color: LightColor.factoryCreate(),
		}
	}

	async setLightState(color: LightColor | undefined, on: Toggle, transition: Duration): Promise<void> {
		await SatelliteResources.getInstance().callResourceRPC(this.id, "setLightState", color, on, transition)
	}
}

export function setupLights(mode: "castmate" | "satellite") {
	definePluginResource(LightResource)

	defineSatelliteResourceSlotHandler(LightResource, {
		satelliteConstructor: SatelliteLight,
		rpcs: {
			async setPlugState(resource, color: LightColor | undefined, on: Toggle, transition: Duration) {
				await resource.setLightState(color, on, transition)
			},
		},
	})

	if (mode == "satellite") return

	//TODO: Make satellite ignore this!
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
					template: true,
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
		result: {
			type: Object,
			properties: {
				lightOn: { type: Boolean, name: "Light Switch", required: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await Promise.allSettled([
				config.light?.setLightState(config.lightColor, config.on, config.transition),
				await abortableSleep(config.transition * 1000, abortSignal),
			])

			return {
				lightOn: config.light?.state?.on ?? false,
			}
		},
	})
}
