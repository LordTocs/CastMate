import { usePluginLogger } from "../logging/logging"
import { Service } from "../util/service"
import mixpanel from "mixpanel"

const logger = usePluginLogger("analytics")

export const AnalyticsService = Service(
	class {
		private mp: mixpanel.Mixpanel | undefined = undefined
		private userId: string | undefined = undefined

		async initialize() {
			const key = import.meta.env.VITE_APP_MIXPANEL_PROJECT_TOKEN

			if (!key) {
				logger.log("No Anayltics Key Found")
				return
			}

			this.mp = mixpanel.init(key, {})
		}

		setUserId(id: string) {
			this.userId = id
		}

		track(event: string, data: object = {}) {
			if (!this.mp) return

			const idInfo = this.userId ? { distinct_id: this.userId } : {}

			this.mp.track(event, {
				...idInfo,
				...data,
			})
		}

		set(data: object) {
			if (!this.mp) return
			if (!this.userId) return

			this.mp.people.set(this.userId, data)
		}
	}
)
