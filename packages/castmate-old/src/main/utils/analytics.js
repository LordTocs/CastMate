import Mixpanel from "mixpanel"
import { app, callIpcFunc, ipcMain, ipcFunc } from "./electronBridge.js"
import logger from "./logger.js"

let analytics = null;
export class Analytics {
	/**
	 *
	 * @returns {Analytics}
	 */
	static getInstance() {
		if (!analytics) {
			analytics = new Analytics();
		}

		return analytics
	}

	constructor() {
		this.analyticsId = null

		ipcFunc("analytics", "track", (name, data) => this.track(name, data))

		ipcFunc("analytics", "set", (data) => this.set(data))

		const isProd = import.meta.env.PROD
		const key = import.meta.env.VITE_APP_MIXPANEL_PROJECT_TOKEN
		const forceTrack = import.meta.VITE_DEV_ANALYTICS

		if (!key) {
			logger.error(`Missing Mixpanel Key`)
		}

		if (key && (isProd || forceTrack)) {
			this.mixpanel = Mixpanel.init(key, {})
		}
	}

	setUserId(id) {
		this.analyticsId = id

		callIpcFunc("analytics_setId", id)
	}

	track(eventName, data) {
		if (!this.mixpanel) return

		this.mixpanel.track(eventName, {
			...(this.analyticsId ? { distinct_id: this.analyticsId } : {}),
			...(data ? data : {}),
		})
	}

	set(data) {
		if (!this.mixpanel) return
		if (!this.analyticsId) return
		this.mixpanel.people.set(
			this.analyticsId,
			{
				...data,
			}
		)
	}
}
