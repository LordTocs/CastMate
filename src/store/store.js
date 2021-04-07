import ipcModule from './ipc';
import rewardsModule from './rewards';
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export const store = new Vuex.Store({
	modules: {
		ipc: ipcModule,
		rewards: rewardsModule
	}
});