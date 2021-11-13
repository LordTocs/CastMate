import ipcModule from './ipc';
import rewardsModule from './rewards';
import segmentsModule from './segments';
import variablesModule from './variables';
import Vue from 'vue';
import Vuex from 'vuex';

import { ipcRenderer } from "electron";

Vue.use(Vuex);

export const store = new Vuex.Store({
	modules: {
		ipc: ipcModule,
		rewards: rewardsModule,
		segments: segmentsModule,
		variables: variablesModule
	}
});

ipcRenderer.sendSync("main-window", "hello!");

ipcRenderer.on('state-update', (event, arg) => {
	store.dispatch('ipc/stateUpdate', arg);
});

ipcRenderer.on('state-removal', (event, arg) => {
	store.dispatch(`ipc/removeState`, arg);
})
