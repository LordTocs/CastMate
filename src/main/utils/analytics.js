import Mixpanel from 'mixpanel'
import { ipcMain } from './electronBridge.js'

export class Analytics {
    constructor(ipcSender) {
        this.analyticsId = null;

        this.ipcSender = ipcSender;

        ipcMain.handle("analytics_track", async (eventName, data) => {
            this.track(eventName, data);
        })

        ipcMain.handle("analytics_set", async (data) => {
            this.set(data);
        })

        if (process.env.VITE_APP_MIXPANEL_PROJECT_TOKEN && (process.env.NODE_ENV == 'production' || process.env.DEV_ANALYTICS))
        {
            this.mixpanel = Mixpanel.init(process.env.VITE_APP_MIXPANEL_PROJECT_TOKEN, {
                debug: (process.env.NODE_ENV !== 'production' && !process.env.DEV_ANALYTICS)
            });
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
