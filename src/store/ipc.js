
const { ipcRenderer } = require("electron");

class IPCClient
{
	async getCombinedState()
	{
		return await ipcRenderer.invoke("getCombinedState");
	}
}

export default {
	namespaced: true,
	state()
	{
		return {
			inited: false,
			plugins: [],
			client: null,
			paths: {},
		}
	},
	getters: {
		paths: state => state.paths,
		plugins: state => state.plugins,
		inited: state => state.inited,
		client: state => state.client,
		actions: state =>
		{
			let result = {};
			for (let plugin of state.plugins)
			{
				Object.assign(result, plugin.actions)
			}
			//Special Injected Actions, these don't map to a plugin action.
			result.delay = {
				name: "Delay",
				data: { type: "Number" },
				description: "Puts a delay after the current action",
			};
			result.beforeDelay = {
				name: "Delay (Before)",
				data: { type: "Number" },
				description: "Puts a delay before the current action",
			};
			result.import = {
				name: "Play a Sequence",
				data: {
					type: "FilePath",
					path: './sequences/',
					basePath: './'
				},
				description: "Plays a Sequence",
				color: "#7C4275"
			}
			result.timestamp = {
				name: "Timestamp",
				data: { type: "Number" },
				description: "Delays execution of this action until a certain time after the start of this action list."
			}
			return result;
		},
		triggers: state =>
		{
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
		},
		setClient(state, client)
		{
			state.client = client;
		},
		setPaths(state, paths)
		{
			state.paths = paths
		}
	},
	actions: {
		async init({ commit })
		{
			commit('setClient', new IPCClient());

			await ipcRenderer.invoke("waitForInit");
			commit('setInited');

			let plugins = await ipcRenderer.invoke('getPlugins');
			commit('setPlugins', plugins);

			const paths = await ipcRenderer.invoke('getPaths');
			commit('setPaths', paths);
		},
	}
}