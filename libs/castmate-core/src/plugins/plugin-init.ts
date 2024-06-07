import { type Plugin } from "./plugin"

export let initingPlugin: Plugin | null = null

export function setInitingPlugin(plugin: Plugin | null) {
	initingPlugin = plugin
}
