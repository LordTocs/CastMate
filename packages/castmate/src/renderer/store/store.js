import ipcModule from './ipc'
import segmentsModule from './segments'
import Vuex from 'vuex'

import { ipcRenderer } from "electron"

export const store = new Vuex.Store({
	modules: {
		ipc: ipcModule,
		segments: segmentsModule,
	}
});

ipcRenderer.on('profiles-active', (event, arg) => {
	store.dispatch(`ipc/setActiveProfiles`, arg);
})





