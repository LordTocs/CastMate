
const { ipcRenderer } = require("electron");


export default {
	namespaced: true,
	state()
	{
		return {
			inited: false,
			plugins: [],
		}
	},
	getters: {
		plugins: state => state.plugins,
		inited: state => state.inited,
		actions: state => {
			let result = {};
			for (let plugin of state.plugins)
			{
				Object.assign(result, plugin.actions)
			}
			result.delay = {
				name: "Delay (After)",
				data: { type: "Number" },
				description: "Puts a delay after the current action",
			};
			result.beforeDelay = {
				name: "Delay (Before)",
				data: { type: "Number" },
				description: "Puts a delay before the current action",
			};
			result.timestamp = {
				name: "Timestamp",
				data: { type: "Number" },
				description: "Delays execution of this action until a certain time after the start of this action list."
			}
			return result;
		},
		triggers: state => {
			let result = {};
			for (let plugin of state.plugins)
			{
				Object.assign(result, plugin.triggers)
			}
			return result;
		}
	},
	mutations: {
		setInited(state)
		{
			state.inited = true;
		},
		setPlugins(state, plugins)
		{
			state.plugins = plugins;
		}
	},
	actions: {
		async init({ commit }) {
			await ipcRenderer.invoke("waitForInit");
			commit('setInited');

			let plugins = await ipcRenderer.invoke('getPlugins');
			commit('setPlugins', plugins);
		},
	}
}