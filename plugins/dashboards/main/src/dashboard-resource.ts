import {
	definePluginResource,
	FileResource,
	ResourceStorage,
	SatelliteResources,
	SatelliteService,
	usePluginLogger,
} from "castmate-core"
import { DashboardConfig, DashboardResourceSlot, InitialDashboardConfig } from "castmate-plugin-dashboards-shared"
import { nanoid } from "nanoid/non-secure"
import { coreAxios } from "castmate-core"
import _isEqual from "lodash/isEqual"
import { TwitchAccount } from "castmate-plugin-twitch-main"
import { DashboardAccessService } from "./dashboard-access"

const API_BASE_URL = "https://api.castmate.io"

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
			resourceSlots: [],
		}
	}

	getWidget(widgetId: string) {
		for (const page of this.config.pages) {
			for (const section of page.sections) {
				for (const widget of section.widgets) {
					if (widget.id == widgetId) return widget
				}
			}
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

	private async updateResourceSlots(updatedSlots: DashboardResourceSlot[]) {
		const existingSlots = this.config.resourceSlots

		const deleteSlots = new Array<string>()
		const createSlots = new Array<{ id: string; type: string; name: string }>()

		for (const existingSlot of existingSlots) {
			const updated = updatedSlots.find((s) => s.id == existingSlot.id)

			if (!updated || existingSlot.slotType != updated.slotType) {
				deleteSlots.push(existingSlot.id)
			}
		}

		for (const updatedSlot of updatedSlots) {
			const existing = existingSlots.find((s) => s.id == updatedSlot.id)

			if (!existing || existing.slotType != updatedSlot.slotType) {
				createSlots.push({ id: updatedSlot.id, type: updatedSlot.slotType, name: updatedSlot.name })
			}
		}

		for (const deleteSlot of deleteSlots) {
			await SatelliteResources.getInstance().deleteRemoteResourceSlot(deleteSlot)
		}

		for (const createSlot of createSlots) {
			await SatelliteResources.getInstance().createRemoteResourceSlot(
				createSlot.id,
				createSlot.type,
				createSlot.name
			)
		}

		for (const slot of updatedSlots) {
			await SatelliteResources.getInstance().enforceRemoteSlotName(slot.id, slot.name)
		}
	}

	async load(savedConfig: DashboardConfig): Promise<boolean> {
		//this.updateResourceSlots(savedConfig.resourceSlots)
		return await super.load(savedConfig)
	}

	static async finishInitResourceSlots() {
		for (const dashboard of this.storage) {
			for (const slot of dashboard.config.resourceSlots) {
				await SatelliteResources.getInstance().createRemoteResourceSlot(slot.id, slot.slotType, slot.name)
			}
		}
	}

	async setConfig(config: DashboardConfig): Promise<boolean> {
		let needsCloudUpdate = !_isEqual(config.remoteTwitchIds, this.config?.remoteTwitchIds)

		await this.updateResourceSlots(config.resourceSlots)

		const result = await super.setConfig(config)

		if (needsCloudUpdate) {
			await this.updateDashCloud()

			Dashboard.updateSatelliteListening()
		}

		DashboardAccessService.getInstance().dashboardConfigChanged(this.id)

		return result
	}

	async applyConfig(config: Partial<DashboardConfig>): Promise<boolean> {
		let needsCloudUpdate =
			"remoteTwitchIds" in config && !_isEqual(config.remoteTwitchIds, this.config.remoteTwitchIds)

		if (config.resourceSlots) {
			await this.updateResourceSlots(config.resourceSlots)
		}

		const result = await super.applyConfig(config)

		if (needsCloudUpdate) {
			await this.updateDashCloud()

			Dashboard.updateSatelliteListening()
		}

		DashboardAccessService.getInstance().dashboardConfigChanged(this.id)

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

		for (const slot of resource.config.resourceSlots) {
			await SatelliteResources.getInstance().deleteRemoteResourceSlot(slot.id)
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
			SatelliteService.getInstance().startRTCSignalListening()
		} else {
			logger.log("Stopping Satellite")
			SatelliteService.getInstance().stopRTCSignalListening()
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
