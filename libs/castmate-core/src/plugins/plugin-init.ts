import { type Plugin } from "./plugin"

export let initingPlugin: Plugin | undefined = undefined

export function setInitingPlugin(plugin: Plugin | undefined) {
	initingPlugin = plugin
}
