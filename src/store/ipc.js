
const { ipcRenderer } = require("electron");
import Vue from 'vue';

export default {
	namespaced: true,
	state() {
		return {
			inited: false,
			plugins: [],
			client: null,
			paths: {},
			tags: [],
			stateLookup: {}
		}
	},
	getters: {
		paths: state => state.paths,
		plugins: state => state.plugins,
		inited: state => state.inited,
		tags: state => state.tags,
		stateLookup: state => state.stateLookup,
		actions: state => {
			let result = {};
			for (let plugin of state.plugins) {
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
		triggers: state => {
			let result = {};
			for (let plugin of state.plugins) {
				Object.assign(result, plugin.triggers)
			}
			return result;
		},
		stateSchemas: state => {
			const result = {};

			for (let plugin of state.plugins)
			{
				result[plugin.name] = plugin.stateSchemas;
			}

			return result;
		}
	},
	mutations: {
		setInited(state) {
			state.inited = true;
		},
		setPlugins(state, plugins) {
			state.plugins = plugins;
		},
		setPaths(state, paths) {
			state.paths = paths
		},
		setTags(state, tags) {
			state.tags = tags;
		},
		applyState(state, update) {
			for (let pluginKey in update) {
				if (!state.stateLookup[pluginKey]) {
					Vue.set(state.stateLookup, pluginKey, {});
				}
				for (let stateKey in update[pluginKey]) {
					Vue.set(state.stateLookup[pluginKey], stateKey, update[pluginKey][stateKey]);
				}
			}
		},
		removeState(state, removal) {
			for (let pluginKey in removal)
			{
				if (!this.stateLookup[pluginKey])
					continue;
				
				Vue.delete(state.stateLookup[pluginKey], removal[pluginKey]);

				if (Object.keys(state.stateLookup[pluginKey]) == 0)
				{
					Vue.delete(state.stateLookup, pluginKey);
				}
			}
		}
	},
	actions: {
		async init({ commit }) {
			await ipcRenderer.invoke("waitForInit");
			commit('setInited');

			let plugins = await ipcRenderer.invoke('getPlugins');
			commit('setPlugins', plugins);

			const paths = await ipcRenderer.invoke('getPaths');
			commit('setPaths', paths);

			const tags = await ipcRenderer.invoke('twitch_getAllTags');
			commit('setTags', tags);

			commit('applyState', await ipcRenderer.invoke("getStateLookup"));
		},
		stateUpdate({ commit }, update) {
			console.log("applyState", update);
			commit('applyState', update);
		},
		removeState({ commit }, varName) {
			commit('removeState', varName);
		}
	}
}