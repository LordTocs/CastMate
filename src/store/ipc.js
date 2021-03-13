
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
		inited: state => state.inited
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