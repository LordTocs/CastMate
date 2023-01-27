import ipcModule from './ipc'
import segmentsModule from './segments'
import variablesModule from './variables'
import resourcesModule from './resources'
import Vuex from 'vuex'

import { ipcRenderer } from "electron"

export const store = new Vuex.Store({
	modules: {
		ipc: ipcModule,
		segments: segmentsModule,
		variables: variablesModule,
		resources: resourcesModule,
	}
});

ipcRenderer.on('state-update', (event, arg) => {
	store.dispatch('ipc/stateUpdate', arg);
});

ipcRenderer.on('analytics-id', (event, arg) => {
	store.dispatch('ipc/setAnalyticsId', arg);
})

ipcRenderer.on('state-removal', (event, arg) => {
	store.dispatch(`ipc/removeState`, arg);
})

ipcRenderer.on('profiles-active', (event, arg) => {
	store.dispatch(`ipc/setActiveProfiles`, arg);
})

ipcRenderer.on('resources_updateResourceArray', (event, { type, resources} ) => {
	store.dispatch('resources/updateResourceArray', { type, resources })
})




