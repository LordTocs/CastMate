import { PluginManager } from "castmate-core/src/plugins/plugin-manager"
import discordPlugin from "castmate-plugin-discord-main"
import httpPlugin from "castmate-plugin-http-main"
import inputPlugin from "castmate-plugin-input-main"
import iotPlugin from "castmate-plugin-iot-main"
import minecraftPlugin from "castmate-plugin-minecraft-main"
import obsPlugin from "castmate-plugin-obs-main"
import osPlugin from "castmate-plugin-os-main"
import soundPlugin from "castmate-plugin-sound-main"
import timePlugin from "castmate-plugin-time-main"
import twitchPlugin from "castmate-plugin-twitch-main"
import voicemodPlugin from "castmate-plugin-voicemod-main"

import variablesPlugin from "castmate-plugin-variables-main"

import kasaPlugin from "castmate-plugin-tplink-kasa-main"
import huePlugin from "castmate-plugin-philips-hue-main"
import elgatoPlugin from "castmate-plugin-elgato-main"
import lifxPlugin from "castmate-plugin-lifx-main"
import wyzePlugin from "castmate-plugin-wyze-main"
import goveePlugin from "castmate-plugin-govee-main"
import twinklyPlugin from "castmate-plugin-twinkly-main"

import spellcastPlugin from "castmate-plugin-spellcast-main"

import streamPlanPlugin from "castmate-plugin-stream-plans-main"

import overlayPlugin from "castmate-plugin-overlays-main"

import dashboardPlugin from "castmate-plugin-dashboards-main"

import randomPlugin from "castmate-plugin-random-main"
import remotePlugin from "castmate-plugin-remote-main"

import blueskyPlugin from "castmate-plugin-bluesky-main"

import advssPlugin from "castmate-plugin-advss-main"

import castmatePlugin from "./builtin-plugin"
import { WebService, Plugin } from "castmate-core"
import { migratePlugin } from "./migration/old-migration"

export async function loadPlugin(plugin: Plugin) {
	await migratePlugin(plugin.id)
	await PluginManager.getInstance().registerPlugin(plugin)
}

export async function loadPlugins() {
	const pluginManager = PluginManager.getInstance()

	await loadPlugin(castmatePlugin)
	await loadPlugin(randomPlugin)
	await loadPlugin(soundPlugin)
	await loadPlugin(overlayPlugin)
	//await loadPlugin(dashboardPlugin)

	const promises = [
		loadPlugin(timePlugin),
		loadPlugin(twitchPlugin),
		loadPlugin(discordPlugin),
		loadPlugin(obsPlugin),
		loadPlugin(iotPlugin),
		loadPlugin(osPlugin),
		loadPlugin(httpPlugin),
		loadPlugin(inputPlugin),
		loadPlugin(voicemodPlugin),
		loadPlugin(minecraftPlugin),
		loadPlugin(remotePlugin),
		loadPlugin(blueskyPlugin),
	]

	await Promise.allSettled(promises)

	const obsDeps = [loadPlugin(advssPlugin)]
	await Promise.allSettled(obsDeps)

	await loadPlugin(variablesPlugin)

	await loadPlugin(spellcastPlugin)

	await loadPlugin(streamPlanPlugin)

	//iot
	const iotPromises = [
		loadPlugin(huePlugin),
		loadPlugin(kasaPlugin),
		loadPlugin(elgatoPlugin),
		loadPlugin(lifxPlugin),
		loadPlugin(wyzePlugin),
		loadPlugin(goveePlugin),
		loadPlugin(twinklyPlugin),
	]

	await Promise.allSettled(iotPromises)

	await WebService.getInstance().startWebsockets()
}
