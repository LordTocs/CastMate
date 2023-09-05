import { PluginManager } from "castmate-core/src/plugins/plugin-manager"
import twitchPlugin from "castmate-plugin-twitch-main"
import soundPlugin from "castmate-plugin-sound-main"
import obsPlugin from "castmate-plugin-obs-main"
import castmatePlugin from "./builtin-plugin"

export async function loadPlugins() {
	PluginManager.getInstance().registerPlugin(castmatePlugin)
	PluginManager.getInstance().registerPlugin(twitchPlugin)
	PluginManager.getInstance().registerPlugin(obsPlugin)
	PluginManager.getInstance().registerPlugin(soundPlugin)
}
