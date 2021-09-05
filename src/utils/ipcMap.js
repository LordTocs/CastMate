import { ipcRenderer } from 'electron'; 

export function mapIpcs(pluginName, functions)
{
	let result = {}
	for (let ipcMethod of functions)
	{
		console.log(`Binding ${ipcMethod}`)
		result[ipcMethod] = async function (...args) {
			return await ipcRenderer.invoke(`${pluginName}_${ipcMethod}`, ...args);
		}
	}
	return result;
}
