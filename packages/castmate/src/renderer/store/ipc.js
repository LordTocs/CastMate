
const { ipcRenderer } = require("electron");

const builtInPlugin = {
	name: 'castmate',
	uiName: 'CastMate',
	color: '#8DC1C0',
	icon: 'mdi-alpha-c-box',
	actions: {
		delay: {
			name: "Delay",
			color: '#8DC1C0',
			icon: "mdi-timer-sand",
			data: { type: "Number", required: true, unit: { name: "Seconds", short: "s" }, },
			description: "Puts a delay after the current action",
		},
		timestamp: {
			name: "Timestamp",
			color: '#8DC1C0',
			icon: "mdi-clock-outline",
			data: { type: "Number", required: true, unit: { name: "Seconds", short: "s" }, },
			description: "Delays execution of this action until a certain time after the start of this action list."
		},
		automation: {
			name: "Automation",
			color: '#8DC1C0',
			icon: "mdi-cog",
			data: {
				type: "Object",
				properties: {
					automation: { type: "Automation", required: true },
				},
			},
			description: "Runs another automation inside this one."
		},
	},
	settings: {
		port: { type: "Number", default: 80, name: "Internal Webserver Port" }
	},
	secrets: {},
	triggers: {},
	stateSchemas: {},
	ipcMethods: [],
}


export default {
	namespaced: true,
	state() {
		return {
			inited: false,
			plugins: [],
			client: null,
			paths: {},
			stateLookup: {},
			activeProfiles: [],
			analyticsId: null,
		}
	},
	getters: {
		paths: state => state.paths,
		activeProfiles: state => state.activeProfiles,
		inited: state => state.inited,
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
		setActiveProfiles(state, activeProfiles) {
			state.activeProfiles = activeProfiles;
		},
	},
	actions: {
		async init({ commit }) {
			await ipcRenderer.invoke("waitForInit");
			commit('setInited');

			const paths = await ipcRenderer.invoke('getPaths');
			commit('setPaths', paths);

			commit('setActiveProfiles',  await ipcRenderer.invoke('core_getActiveProfiles'));
		},
		setActiveProfiles({ commit }, activeProfiles) {
			commit('setActiveProfiles', activeProfiles);
		}
	}
}