import { PlugConfig, PlugState } from "castmate-plugin-iot-shared"
import { Resource, ResourceStorage, defineAction, definePluginResource } from "castmate-core"
import { Toggle } from "castmate-schema"

export class PlugResource<Config extends PlugConfig = PlugConfig, State extends PlugState = PlugState> extends Resource<
	Config,
	State
> {
	static storage = new ResourceStorage<PlugResource>("Plug")

	async setPlugState(on: Toggle) {}
}

export class PollingPlug<
	Config extends PlugConfig = PlugConfig,
	State extends PlugState = PlugState
> extends PlugResource<Config, State> {
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
		clearInterval(this.poller)
		this.poller = undefined
	}

	async poll() {}
}

export function setupPlugs() {
	definePluginResource(PlugResource)

	defineAction({
		id: "plug",
		name: "Switch Plug",
		icon: "mdi mdi-power-plug-outline",
		config: {
			type: Object,
			properties: {
				plug: { type: PlugResource, name: "Plug", required: true },
				switch: {
					type: Toggle,
					name: "Switch",
					required: true,
					default: true,
					trueIcon: "mdi mdi-power-plug",
					falseIcon: "mdi mdi-power-plug-off",
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			await config.plug?.setPlugState(config.switch)
		},
	})
}
