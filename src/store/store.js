import ipcModule from './ipc';
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export const store = new Vuex.Store({
	modules: {
		ipc: ipcModule
	}
});