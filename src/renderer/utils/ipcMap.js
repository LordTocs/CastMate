import { ipcRenderer } from 'electron'; 
import _cloneDeep from 'lodash/cloneDeep'

export function mapIpcs(pluginName, functions)
{
	let result = {}
	for (let ipcMethod of functions)
	{
		console.log(`Binding ${ipcMethod}`)
		result[ipcMethod] = async function (...args) {
			//Do we really have to clone? It appears ipcRenderer.invoke does not understand what a Proxy is.
			return await ipcRenderer.invoke(`${pluginName}_${ipcMethod}`, ...(args.map(a => _cloneDeep(a))));
		}
	}
	return result;
}
