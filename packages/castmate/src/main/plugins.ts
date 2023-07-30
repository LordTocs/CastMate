import { PluginManager } from "castmate-core/src/plugins/plugin-manager"
import twitchPlugin from "castmate-plugin-twitch-main"

export async function loadPlugins() {
	PluginManager.getInstance().registerPlugin(twitchPlugin)

	PluginManager.getInstance().load()
}
