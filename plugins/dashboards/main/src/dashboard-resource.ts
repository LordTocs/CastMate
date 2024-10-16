import { definePluginResource, FileResource, ResourceStorage } from "castmate-core"
import { DashboardConfig, InitialDashboardConfig } from "castmate-plugin-dashboards-shared"
import { nanoid } from "nanoid/non-secure"

export class Dashboard extends FileResource<DashboardConfig> {
	static resourceDirectory = "./dashboards"
	static storage = new ResourceStorage<Dashboard>("Dashboard")

	constructor(initialName?: string) {
		super()

		if (initialName) {
			this._id = nanoid()
		}

		this._config = {
			name: initialName ?? "",
			pages: [],
			remoteTwitchIds: [],
		}
	}

	async setConfig(config: DashboardConfig): Promise<boolean> {
		const result = await super.setConfig(config)
		//OverlayWebsocketService.getInstance().overlayConfigChanged(this.id)
		return result
	}

	async applyConfig(config: Partial<DashboardConfig>): Promise<boolean> {
		const result = await super.applyConfig(config)
		//OverlayWebsocketService.getInstance().overlayConfigChanged(this.id)
		return result
	}
}

export function setupDashboardResources() {
	definePluginResource(Dashboard)
}
