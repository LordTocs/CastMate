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

import overlayPlugin from "castmate-plugin-overlays-main"

import randomPlugin from "castmate-plugin-random-main"
import remotePlugin from "castmate-plugin-remote-main"

import castmatePlugin from "./builtin-plugin"
import { WebService } from "castmate-core"

export async function loadPlugins() {
	const pluginManager = PluginManager.getInstance()
	const promises = [
		pluginManager.registerPlugin(castmatePlugin),
		pluginManager.registerPlugin(randomPlugin),
		pluginManager.registerPlugin(overlayPlugin),
		pluginManager.registerPlugin(variablesPlugin),
		pluginManager.registerPlugin(timePlugin),
		pluginManager.registerPlugin(twitchPlugin),
		pluginManager.registerPlugin(discordPlugin),
		pluginManager.registerPlugin(obsPlugin),
		pluginManager.registerPlugin(iotPlugin),
		pluginManager.registerPlugin(soundPlugin),
		pluginManager.registerPlugin(osPlugin),
		pluginManager.registerPlugin(httpPlugin),
		pluginManager.registerPlugin(inputPlugin),
		pluginManager.registerPlugin(voicemodPlugin),
		pluginManager.registerPlugin(minecraftPlugin),
		pluginManager.registerPlugin(remotePlugin),
	]
	await Promise.allSettled(promises)

	await pluginManager.registerPlugin(spellcastPlugin)

	//iot
	const iotPromises = [
		pluginManager.registerPlugin(huePlugin),
		pluginManager.registerPlugin(kasaPlugin),
		pluginManager.registerPlugin(elgatoPlugin),
		pluginManager.registerPlugin(lifxPlugin),
		pluginManager.registerPlugin(wyzePlugin),
		pluginManager.registerPlugin(goveePlugin),
		pluginManager.registerPlugin(twinklyPlugin),
	]

	await Promise.allSettled(iotPromises)

	await WebService.getInstance().startWebsockets()
}
