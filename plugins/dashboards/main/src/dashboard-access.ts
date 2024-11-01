import { coreAxios, defineIPCFunc, Service, usePluginLogger } from "castmate-core"
import { SatelliteService } from "castmate-core"
import { TwitchAccount, ViewerCache } from "castmate-plugin-twitch-main"
import { SatelliteConnectionOption } from "castmate-schema"
import { nanoid } from "nanoid"

const API_BASE_URL = import.meta.env.VITE_CASTMATE_URL

interface RemoteDashboardInfo {
	ownerId: string
	dashboardId: string
	dashboardName: string
}

const logger = usePluginLogger("dashboards")

export const DashboardAccessService = Service(
	class {
		constructor() {
			defineIPCFunc("dashboards", "refreshConnections", async () => {
				logger.log("CONNECTIONSSSSSS")
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
	}
)
