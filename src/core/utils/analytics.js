const Mixpanel = require('mixpanel');

class Analytics {
    constructor(ipcSender) {
        this.analyticsId = null;

        this.ipcSender = ipcSender;

        console.log("Mixpanel Token Exists: " + !!process.env.VUE_APP_MIXPANEL_PROJECT_TOKEN);
        this.mixpanel = Mixpanel.init(process.env.VUE_APP_MIXPANEL_PROJECT_TOKEN);
    }

    setUserId(id) {
        this.analyticsId = id;

        this.ipcSender.send('analytics-id', id);
    }

    track(eventName, data) {

        this.mixpanel.track(eventName, {
            ...this.analyticsId ? { distinct_id: this.analyticsId } : {},
            ...data
        });
    }

    set(data) {
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

module.exports = { Analytics }