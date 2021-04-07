import { store } from '../store/store';
import { ipcRenderer } from 'electron'; 

export function mapIpcs(pluginName)
{
	let plugins = store.getters['ipc/plugins'];
	let plugin = plugins.find((p) => p.name == pluginName);

	if (!plugin)
		return {}
	
	let result = {}
	for (let ipcMethod of plugin.ipcMethods)
	{
		result[ipcMethod] = async function (...args) {
			return await ipcRenderer.invoke(`${plugin.name}_${ipcMethod}`, ...args);
		}
	}
	return result;
}