import { PluginManager, Plugin } from "castmate-core"

import { twitchSatellite } from "castmate-plugin-twitch-main"
import { dashboardSatellite } from "castmate-plugin-dashboards-main"

export async function loadPlugin(plugin: Plugin) {
	await PluginManager.getInstance().registerPlugin(plugin)
}

export async function loadPlugins() {
	await loadPlugin(twitchSatellite)
	await loadPlugin(dashboardSatellite)

	//iot
	const iotPromises: Promise<any>[] = [
		// loadPlugin(huePlugin),
		// loadPlugin(kasaPlugin),
		// loadPlugin(elgatoPlugin),
		// loadPlugin(lifxPlugin),
		// loadPlugin(wyzePlugin),
		// loadPlugin(goveePlugin),
		// loadPlugin(twinklyPlugin),
	]

	await Promise.allSettled(iotPromises)

	//await WebService.getInstance().startWebsockets()
}
