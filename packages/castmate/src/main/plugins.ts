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

import castmatePlugin from "./builtin-plugin"

export async function loadPlugins() {
	const pluginManager = PluginManager.getInstance()
	const promises = [
		pluginManager.registerPlugin(castmatePlugin),
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
	]
	await Promise.allSettled(promises)
}
