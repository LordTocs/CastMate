import { LightColor, LightConfig, LightResource, LightResourceSpec, LightState } from "castmate-plugin-iot-shared"
import { Service, implementResource, isSatellite, registerSchemaTemplate, template } from "castmate-core"
import { Duration, Toggle, Resource } from "castmate-schema"
import { SatelliteResourceSymbol } from "castmate-core"

// export class LightResource<
// 	Config extends LightConfig = LightConfig,
// 	State extends LightState = LightState
// > extends Resource<Config, State> {
// 	static storage = new ResourceStorage<LightResource>("Light")

// 	async setLightState(color: LightColor | undefined, on: Toggle, transition: Duration) {}
// }

const Lights = implementResource(LightResourceSpec, {
	async create(name: string, initialState: LightState, initialConfig: LightConfig) {
		return {
			id: `${initialConfig.provider}.${initialConfig.providerId}`,
			name: name,
			config: initialConfig,
			state: initialState,
		}
	},
	functions: {
		async setLightState(color, on, transition) {
			await LightService.getInstance().sendLightState(this, color, on, transition)
			return false
		},
	},
})

interface LightProvider<PrivateData = any> {
	id: string
	setLightState(
		light: LightResource,
		data: PrivateData,
		color: LightColor,
		on: Toggle,
		transition: Duration
	): Promise<void>
	initialize(): Promise<void>
	uninitialize(): Promise<void>
}

interface PollingLightProvider<PrivateData = any> extends LightProvider<PrivateData> {
	pollLights?(): Promise<void>
	pollLight?(light: LightResource, data: PrivateData): Promise<void>
}

export const LightService = Service(
	class {
		private providers = new Map<string, LightProvider>()
		private privateData = new WeakMap<LightResource, any>()

		async provideLight<PrivateData>(
			provider: LightProvider<PrivateData>,
			data: PrivateData,
			name: string,
			initialState: LightState,
			initialConfig: LightConfig
		) {
			const res = await Lights.create(name, initialState, initialConfig)
			this.privateData.set(res, data)
		}

		async unprovideLight(provider: LightProvider, id: string) {
			await Lights.removeResources(`${provider.id}.${id}`)
		}

		async sendLightState(light: LightResource, color: LightColor, on: Toggle, transition: Duration) {
			const provider = this.providers.get(light.config.provider)
			if (provider == null) {
				throw new Error("Missing Light Provider")
			}

			const data = this.privateData.get(light)

			if (data == null) {
				throw new Error("Missing Private Data")
			}

			await provider.setLightState(light, data, color, on, transition)
		}

		async updateLightState(provider: LightProvider, id: string, color: LightColor, on: boolean) {
			const light = Lights.getById(`${provider.id}.${id}`)
			if (!light) {
				throw new Error("Light Resource Doesn't Exist")
			}
			light.state.color = color
			light.state.on = on
		}

		registerProvider(provider: LightProvider) {}

		unregisterProvider(provider: LightProvider) {}
	}
)

export function useLightProvider<PrivateData>(provider: () => LightProvider<PrivateData>) {
	const provided = provider()

	LightService.getInstance().registerProvider(provided)

	//TODO: Lifetime hooks
}

export function usePollingLightProvider<PrivateData>(provider: () => PollingLightProvider<PrivateData>) {
	const provided = provider()

	LightService.getInstance().registerProvider(provided)

	//TODO: Lifetime hooks
}

// export class PollingLight<
// 	Config extends LightConfig = LightConfig,
// 	State extends LightState = LightState
// > extends LightResource<Config, State> {
// 	poller: NodeJS.Timer | undefined = undefined

// 	startPolling(interval: number) {
// 		this.stopPolling()
// 		this.poller = setInterval(async () => {
// 			try {
// 				this.poll()
// 			} catch (err) {}
// 		}, interval * 1000)
// 	}

// 	stopPolling() {
// 		//@ts-expect-error
// 		clearInterval(this.poller)
// 		this.poller = undefined
// 	}

// 	async poll() {}
// }

// registerSchemaTemplate(LightColor, async (value, context, schema) => {
// 	return (await template(value, context)) as LightColor
// })

// export class SatelliteLight extends LightResource {
// 	static [SatelliteResourceSymbol] = true

// 	constructor() {
// 		super()
// 		this._config = {
// 			name: "",
// 			provider: "satellite",
// 			providerId: "",
// 			rgb: {
// 				available: true,
// 			},
// 			kelvin: {
// 				available: true,
// 			},
// 			dimming: {
// 				available: true,
// 			},
// 			transitions: {
// 				available: true,
// 			},
// 		}

// 		this.state = {
// 			on: true,
// 			color: LightColor.factoryCreate(),
// 		}
// 	}

// 	async setLightState(color: LightColor | undefined, on: Toggle, transition: Duration): Promise<void> {
// 		await SatelliteResources.getInstance().callResourceRPC(this.id, "setLightState", color, on, transition)
// 	}
// }

// export function setupLights() {
// 	definePluginResource(LightResource)

// 	defineSatelliteResourceSlotHandler(LightResource, {
// 		satelliteConstructor: SatelliteLight,
// 		rpcs: {
// 			async setLightState(resource, color: LightColor | undefined, on: Toggle, transition: Duration) {
// 				await resource.setLightState(color, on, transition)
// 			},
// 		},
// 	})

// 	if (isSatellite()) return

// 	//TODO: Make satellite ignore this!
// 	defineAction({
// 		id: "light",
// 		name: "Change Light",
// 		icon: "mdi mdi-lightbulb-on-outline",
// 		duration: {
// 			dragType: "length",
// 			rightSlider: {
// 				sliderProp: "transition",
// 			},
// 		},
// 		config: {
// 			type: Object,
// 			properties: {
// 				light: { type: LightResource, name: "Light", required: true },
// 				on: {
// 					type: Toggle,
// 					name: "Light Switch",
// 					required: true,
// 					default: true,
// 					template: true,
// 					trueIcon: "mdi mdi-lightbulb-on",
// 					falseIcon: "mdi mdi-lightbulb-outline",
// 				},
// 				lightColor: {
// 					type: LightColor,
// 					name: "Color",
// 					resource: "light",
// 					template: true,
// 				},
// 				transition: { type: Duration, name: "Transition Time", required: true, default: 0.5 },
// 			},
// 		},
// 		result: {
// 			type: Object,
// 			properties: {
// 				lightOn: { type: Boolean, name: "Light Switch", required: true },
// 			},
// 		},
// 		async invoke(config, contextData, abortSignal) {
// 			await Promise.allSettled([
// 				config.light?.setLightState(config.lightColor, config.on, config.transition),
// 				await abortableSleep(config.transition * 1000, abortSignal),
// 			])

// 			return {
// 				lightOn: config.light?.state?.on ?? false,
// 			}
// 		},
// 	})
// }
