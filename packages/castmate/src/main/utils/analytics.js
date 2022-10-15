import Mixpanel from 'mixpanel'
import { app, ipcMain } from './electronBridge.js'
import logger from './logger.js';

export class Analytics {
    constructor(ipcSender) {
        this.analyticsId = null;

        this.ipcSender = ipcSender;

        ipcMain.handle("analytics_track", async (ipcEvent, eventName, data) => {
            this.track(eventName, data);
        })

        ipcMain.handle("analytics_set", async (ipcEvent, data) => {
            this.set(data);
        })

        const isProd = import.meta.env.PROD
        const key = import.meta.env.VITE_APP_MIXPANEL_PROJECT_TOKEN
        const forceTrack = import.meta.VITE_DEV_ANALYTICS

        if (!key)
        {
            logger.error(`Missing Mixpanel Key`);
        }

        if (key && (isProd || forceTrack))
        {
            this.mixpanel = Mixpanel.init(key, {});
        }
    }

    setUserId(id) {
        this.analyticsId = id;

        this.ipcSender.send('analytics-id', id);
    }

    track(eventName, data) {
        if (!this.mixpanel)
            return;

        this.mixpanel.track(eventName, {
            ...this.analyticsId ? { distinct_id: this.analyticsId } : {},
            ...(data ? data : {})
        });
    }

    set(data) {
        if (!this.mixpanel)
            return;
        if (!this.analyticsId)
            return;
        this.mixpanel.people.set(this.analyticsId,
            {
                ...data,
            },
            { $ignore_time: true }
        );
    }
}
