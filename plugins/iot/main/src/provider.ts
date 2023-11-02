import { LightResource } from "./light"
import { PlugResource } from "./plug"

export interface IoTProviderConfig {
	id: string
	name: string
	plugType: typeof PlugResource
	lightType: typeof LightResource
	initialize?(): any
	unitialize?(): any
}

export interface PollingIotProviderConfig extends IoTProviderConfig {
	poll(): Promise<any>
}

export function defineIoTProvider(config: IoTProviderConfig) {}

class IoTProvider {
	constructor(private config: IoTProviderConfig) {}

	async initialize() {}

	async unitialize() {}

	async clearPlugs() {
		const ids = new Set<string>()
		for (const plug of PlugResource.storage) {
			if (plug.config.provider == this.config.id) {
				ids.add(plug.id)
			}
		}

		await Promise.allSettled([...ids].map((id) => PlugResource.storage.remove(id)))
	}

	async clearLights() {
		const ids = new Set<string>()
		for (const light of LightResource.storage) {
			if (light.config.provider == this.config.id) {
				ids.add(light.id)
			}
		}

		await Promise.allSettled([...ids].map((id) => LightResource.storage.remove(id)))
	}
}
