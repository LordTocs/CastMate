
import { store } from '../store/store';

import { ipcRenderer } from 'electron';
import _cloneDeep from "lodash/cloneDeep";

export function trackAnalytic(eventName, data) {
    const id = store.getters['ipc/analyticsId'];

    ipcRenderer.invoke("analytics_track", _cloneDeep(eventName), _cloneDeep(data));
}

export function setAnalytic(data) {
    const id = store.getters['ipc/analyticsId'];
    if (!id)
        return;

    ipcRenderer.invoke("analytics_set", data);
}