
import { store } from '../store/store';

import { ipcRenderer } from 'electron';

export function trackAnalytic(eventName, data) {
    const id = store.getters['ipc/analyticsId'];

    ipcRenderer.invoke("analytics_track", eventName, data);
}

export function setAnalytic(data) {
    const id = store.getters['ipc/analyticsId'];
    if (!id)
        return;

    ipcRenderer.invoke("analytics_set", data);
}