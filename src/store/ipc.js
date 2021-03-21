
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