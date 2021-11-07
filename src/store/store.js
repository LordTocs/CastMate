import ipcModule from './ipc';
import rewardsModule from './rewards';
import segmentsModule from './segments';
import variablesModule from './variables';
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export const store = new Vuex.Store({
	modules: {
		ipc: ipcModule,
		rewards: rewardsModule,
		segments: segmentsModule,
		variables: variablesModule
	}
});