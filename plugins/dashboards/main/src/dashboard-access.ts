import {
	autoRerun,
	coreAxios,
	defineIPCFunc,
	onLoad,
	onSatelliteConnection,
	onSatelliteDisconnect,
	onSatelliteRPC,
	onUnload,
	PluginManager,
	ReactiveEffect,
	Service,
	usePluginLogger,
} from "castmate-core"
import { SatelliteService } from "castmate-core"
import { TwitchAccount, ViewerCache } from "castmate-plugin-twitch-main"
import { SatelliteConnectionOption } from "castmate-schema"
import { nanoid } from "nanoid"
import { Dashboard } from "./dashboard-resource"
import { createDashboardConfigEvaluator, DashboardConfigEvaluator } from "./dashboard-config-eval"
import { DashboardConfig } from "castmate-plugin-dashboards-shared"
import { DashboardWidgetManager } from "./dashboard-widgets"

const API_BASE_URL = "https://api.castmate.io"

interface RemoteDashboardInfo {
	ownerId: string
	dashboardId: string
	dashboardName: string
}

const logger = usePluginLogger("dashboards")

interface DashboardStateUpdater {
	plugin: string
	state: string
	reactiveEffect: ReactiveEffect
	satelliteId: string
}

interface OpenDashboard {
	connections: string[]
	evaluator: DashboardConfigEvaluator
}

export type DashboardWidgetRPCHandler = (dashboard: Dashboard, widgetId: string, ...args: any[]) => any

export const DashboardAccessService = Service(
	class {
		private stateUpdaters = new Map<string, DashboardStateUpdater[]>()
		private openDashboards = new Map<string, OpenDashboard>()
		private widgetRPCs = new Map<string, DashboardWidgetRPCHandler>()

		constructor() {
			console.log("DASHBOARD ACCESS!!!!")
			defineIPCFunc("dashboards", "refreshConnections", async () => {
				await this.refreshConnections()
			})
		}
		async refreshConnections() {
			if (!TwitchAccount.channel.isAuthenticated) return

			const resp = await coreAxios.get(`${API_BASE_URL}/api/dashboard-access/remote`, {
				headers: {
					Authorization: `Bearer ${TwitchAccount.channel.secrets.accessToken}`,
				},
			})

			const remoteDashboards = resp.data as RemoteDashboardInfo[]

			logger.log("Remote Dashboards", remoteDashboards)

			const displayDatas = await ViewerCache.getInstance().getDisplayDatasByIds(
				remoteDashboards.map((rdi) => rdi.ownerId)
			)

			const connections = (resp.data as RemoteDashboardInfo[]).map((rdi, index): SatelliteConnectionOption => {
				const displayData = displayDatas[index]
				return {
					id: nanoid(),
					remoteDisplayIcon: displayData.profilePicture,
					remoteUserId: rdi.ownerId,
					remoteDisplayName: displayData.displayName,
					remoteService: "twitch",

					type: "dashboard",
					typeId: rdi.dashboardId,
					name: rdi.dashboardName,
				}
			})

			await SatelliteService.getInstance().setRTCConnectionOptions(connections)
		}

		async onConnection(satelliteId: string) {
			const connection = SatelliteService.getInstance().getConnection(satelliteId)

			if (!connection) return

			const dashboard = Dashboard.storage.getById(connection?.typeId)

			if (!dashboard) return

			logger.log("Dashboard Connection!", dashboard.id, "by", connection.remoteId)

			this.stateUpdaters.set(satelliteId, [])

			let openData = this.openDashboards.get(dashboard.id)

			if (openData) {
				openData.connections.push(satelliteId)

				await SatelliteService.getInstance().callSatelliteRPC<(config: DashboardConfig) => any>(
					satelliteId,
					"dashboard_setConfig",
					openData.evaluator.remoteConfig
				)

				logger.log(`Existing Open Data "${dashboard.id}"`)
			} else {
				openData = {
					connections: [satelliteId],
					evaluator: await createDashboardConfigEvaluator(dashboard.config, async (resolvedConfig) => {
						if (!openData) return
						//logger.log("Dashboard Config Update", resolvedConfig)

						for (const connectionId of openData.connections) {
							await SatelliteService.getInstance().callSatelliteRPC<(config: DashboardConfig) => any>(
								connectionId,
								"dashboard_setConfig",
								resolvedConfig
							)
						}
					}),
				}
				await SatelliteService.getInstance().callSatelliteRPC<(config: DashboardConfig) => any>(
					satelliteId,
					"dashboard_setConfig",
					openData.evaluator.remoteConfig
				)

				this.openDashboards.set(dashboard.id, openData)
			}
		}

		async onDisconnect(satelliteId: string) {
			const updaters = this.stateUpdaters.get(satelliteId)

			if (updaters) {
				for (const updater of updaters) {
					updater.reactiveEffect.dispose()
				}
			}

			const connection = SatelliteService.getInstance().getConnection(satelliteId)

			if (!connection) return

			const dashboard = Dashboard.storage.getById(connection.typeId)

			if (!dashboard) return

			logger.log("Overlay Websocket Disconnected", dashboard.id)

			const openData = this.openDashboards.get(dashboard.id)
			if (openData) {
				const idx = openData.connections.findIndex((s) => s === satelliteId)
				if (idx >= 0) {
					openData.connections.splice(idx)
				}

				if (openData.connections.length == 0) {
					openData.evaluator.effect?.dispose()
					this.openDashboards.delete(dashboard.id)
				}
			}

			this.stateUpdaters.delete(satelliteId)
		}

		async acquireState(satelliteId: string, plugin: string, state: string) {
			const updaters = this.stateUpdaters.get(satelliteId)
			if (updaters == null) return
			if (updaters.find((u) => u.plugin == plugin && u.state == state)) return

			updaters.push({
				plugin,
				state,
				satelliteId,
				reactiveEffect: await autoRerun(() => {
					SatelliteService.getInstance().callSatelliteRPC<(plugin: string, state: string, value: any) => any>(
						satelliteId,
						"dashboard_stateUpdate",
						plugin,
						state,
						PluginManager.getInstance().getState(plugin, state)?.ref?.value
					)
				}),
			})
		}

		async freeState(satelliteId: string, plugin: string, state: string) {
			const updaters = this.stateUpdaters.get(satelliteId)

			if (updaters == null) return

			const idx = updaters.findIndex((u) => u.plugin == plugin && u.state == state)
			if (idx < 0) return

			updaters[idx].reactiveEffect.dispose()

			updaters.splice(idx, 1)
		}

		async dashboardConfigChanged(id: string) {
			//logger.log(`Dashboard Config Updated "${id}"`)

			const connections = this.openDashboards.get(id)
			if (!connections) return

			//logger.log("Dashboards Found", id)

			const dashboard = Dashboard.storage.getById(id)
			if (!dashboard) return

			//logger.log("Triggering", id, connections.evaluator.effect)

			connections.evaluator.effect?.trigger()
		}

		handleWidgetRPC(id: string, func: DashboardWidgetRPCHandler) {
			this.widgetRPCs.set(id, func)
		}

		unhandleWidgetRPC(id: string) {
			this.widgetRPCs.delete(id)
		}

		async handleWidgetRPCRequest(satelliteId: string, rpcId: string, widgetId: string, ...args: any[]) {
			const connection = SatelliteService.getInstance().getConnection(satelliteId)

			const dashboardId = connection?.typeId
			if (!dashboardId) throw new Error("Unknown Dashboard")
			const dashboard = Dashboard.storage.getById(dashboardId)
			if (!dashboard) throw new Error("Unknown Dashboard")

			const handler = this.widgetRPCs.get(rpcId)
			if (!handler) throw new Error(`Unbound RPC "${rpcId}"`)

			return await handler(dashboard, widgetId, ...args)
		}
	}
)

export function setupDashboardSatellite() {
	onLoad(() => {
		DashboardWidgetManager.initialize()
		DashboardAccessService.initialize()
	})

	onSatelliteConnection(async (id) => {
		await DashboardAccessService.getInstance().onConnection(id)
	})

	onSatelliteDisconnect(async (id) => {
		await DashboardAccessService.getInstance().onDisconnect(id)
	})

	onSatelliteRPC("dashboard_acquireState", async (socket, plugin: string, state: string) => {
		await DashboardAccessService.getInstance().acquireState(socket, plugin, state)
	})

	onSatelliteRPC("dashboard_freeState", async (socket, plugin: string, state: string) => {
		await DashboardAccessService.getInstance().freeState(socket, plugin, state)
	})

	onSatelliteRPC("dashboard_widgetRPC", async (satelliteId, id: string, widgetId: string, ...args: any[]) => {
		return await DashboardAccessService.getInstance().handleWidgetRPCRequest(satelliteId, id, widgetId, ...args)
	})
}

export function handleDashboardWidgetRPC<T extends DashboardWidgetRPCHandler>(id: string, func: T) {
	onLoad(() => {
		//logger.log("Registering Widget RPC", id)
		DashboardAccessService.getInstance().handleWidgetRPC(id, func)
	})

	onUnload(() => {
		DashboardAccessService.getInstance().unhandleWidgetRPC(id)
	})
}
