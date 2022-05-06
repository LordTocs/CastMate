
import { store } from '../store/store';
import Vue from 'vue';

export function trackAnalytic(eventName, data) {
    const id = store.getters['ipc/analyticsId'];

    Vue.prototype.$mixpanel.track(eventName, {
        ...id ? { distinct_id: id } : {},
        ...data
    });
}

export function setAnalytic(data) {
    const id = store.getters['ipc/analyticsId'];
    if (!id)
        return;

    Vue.prototype.$mixpanel.people.set(id, {}, {});
}