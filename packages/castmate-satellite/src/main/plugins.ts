import { PluginManager, Plugin } from "castmate-core"

import { twitchSatellite } from "castmate-plugin-twitch-main"
import { dashboardSatellite } from "castmate-plugin-dashboards-main"

import { satelliteIoTPlugin } from "castmate-plugin-iot-main"
import huePlugin from "castmate-plugin-philips-hue-main"
import kasaPlugin from "castmate-plugin-tplink-kasa-main"
import elgatoPlugin from "castmate-plugin-elgato-main"
import lifxPlugin from "castmate-plugin-lifx-main"
import wyzePlugin from "castmate-plugin-wyze-main"
import goveePlugin from "castmate-plugin-govee-main"
import twinklyPlugin from "castmate-plugin-twinkly-main"

import soundPlugin from "castmate-plugin-sound-main"

export async function loadPlugin(plugin: Plugin) {
	await PluginManager.getInstance().registerPlugin(plugin)
}

export async function loadPlugins() {
	await loadPlugin(twitchSatellite)
	console.log("Load Dashboard Satellite")
	await loadPlugin(dashboardSatellite)

	await loadPlugin(satelliteIoTPlugin)

	await loadPlugin(soundPlugin)
	//iot
	const iotPromises: Promise<any>[] = [
		loadPlugin(huePlugin),
		loadPlugin(kasaPlugin),
		loadPlugin(elgatoPlugin),
		loadPlugin(lifxPlugin),
		loadPlugin(wyzePlugin),
		loadPlugin(goveePlugin),
		loadPlugin(twinklyPlugin),
	]

	await Promise.allSettled(iotPromises)

	//await WebService.getInstance().startWebsockets()
}
