import { definePluginResource, FileResource, ResourceStorage, SatelliteService, usePluginLogger } from "castmate-core"
import { DashboardConfig, InitialDashboardConfig } from "castmate-plugin-dashboards-shared"
import { nanoid } from "nanoid/non-secure"
import { coreAxios } from "castmate-core"
import _isEqual from "lodash/isEqual"
import { TwitchAccount } from "castmate-plugin-twitch-main"

const API_BASE_URL = import.meta.env.VITE_CASTMATE_URL

const logger = usePluginLogger("dashboards")

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

	async updateDashCloud() {
		if (this.config.remoteTwitchIds.length > 0) {
			const cloudData = {
				dashboardId: this.id,
				dashboardName: this.config.name,
				allowedTwitchIds: this.config.remoteTwitchIds,
			}

			if (this.config.cloudId) {
				await coreAxios.put(`${API_BASE_URL}/api/dashboard-access/${this.config.cloudId}`, cloudData, {
					headers: {
						Authorization: `Bearer ${TwitchAccount.channel.secrets.accessToken}`,
					},
				})
			} else {
				const resp = await coreAxios.post(`${API_BASE_URL}/api/dashboard-access/`, cloudData, {
					headers: {
						Authorization: `Bearer ${TwitchAccount.channel.secrets.accessToken}`,
					},
				})
				const cloudId = resp.data._id
				await this.applyConfig({ cloudId })
			}
		} else {
			if (this.config.cloudId) {
				await coreAxios.delete(`${API_BASE_URL}/api/dashboard-access/${this.config.cloudId}`, {
					headers: {
						Authorization: `Bearer ${TwitchAccount.channel.secrets.accessToken}`,
					},
				})
				await this.applyConfig({ cloudId: undefined })
			}
		}
	}

	async setConfig(config: DashboardConfig): Promise<boolean> {
		let needsCloudUpdate = !_isEqual(config.remoteTwitchIds, this.config?.remoteTwitchIds)
		const result = await super.setConfig(config)

		if (needsCloudUpdate) {
			await this.updateDashCloud()

			Dashboard.updateSatelliteListening()
		}

		return result
	}

	async applyConfig(config: Partial<DashboardConfig>): Promise<boolean> {
		let needsCloudUpdate =
			"remoteTwitchIds" in config && !_isEqual(config.remoteTwitchIds, this.config.remoteTwitchIds)

		const result = await super.applyConfig(config)

		if (needsCloudUpdate) {
			await this.updateDashCloud()

			Dashboard.updateSatelliteListening()
		}

		//OverlayWebsocketService.getInstance().overlayConfigChanged(this.id)

		return result
	}

	static async onCreate(resource: Dashboard) {
		await super.onCreate(resource)

		this.updateSatelliteListening()
	}

	static async onDelete(resource: Dashboard): Promise<void> {
		if (resource.config.cloudId) {
			await coreAxios.delete(`${API_BASE_URL}/api/dashboard-access/${resource.config.cloudId}`, {
				headers: {
					Authorization: `Bearer ${TwitchAccount.channel.secrets.accessToken}`,
				},
			})
		}

		await super.onDelete(resource)

		this.updateSatelliteListening()
	}

	static updateSatelliteListening() {
		let needsListen = false
		for (const dashboard of this.storage) {
			if (dashboard.config.cloudId) {
				needsListen = true
				break
			}
		}

		if (needsListen) {
			logger.log("Starting Satellite")
			SatelliteService.getInstance().startListening()
		} else {
			logger.log("Stopping Satellite")
			SatelliteService.getInstance().startListening()
		}
	}

	static async initialize(): Promise<void> {
		await super.initialize()

		this.updateSatelliteListening()
	}
}

export function setupDashboardResources() {
	definePluginResource(Dashboard)
}
