import { PluginManager } from "castmate-core/src/plugins/plugin-manager"
import twitchPlugin from "castmate-plugin-twitch-main"
import castmatePlugin from "./builtin-plugin"

export async function loadPlugins() {
	PluginManager.getInstance().registerPlugin(castmatePlugin)
	PluginManager.getInstance().registerPlugin(twitchPlugin)
}
