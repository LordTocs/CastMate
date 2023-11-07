import { ReactiveRef, RetryTimer, onLoad, onSettingChanged } from "castmate-core"
import EventSource from "eventsource"
import { HUEApiLight, HUEEventUpdateData } from "./api"
import { LightResource, PlugResource } from "castmate-plugin-iot-main"
import { PhilipsHUEGroup, PhilipsHUELight, PhilipsHUEPlug, injectResourceFromApi } from "./resources"

interface HUEUpdateEvent {
	type: "update"
	data: HUEEventUpdateData[]
}

interface HUEAddEvent {
	type: "add"
	data: HUEApiLight
}

interface HUEErrorEvent {
	type: "error"
}

type HUEEvent = HUEUpdateEvent | HUEAddEvent | HUEErrorEvent

export function setupHueEvents(hubIp: ReactiveRef<string | undefined>, hubKey: ReactiveRef<string | undefined>) {
	let eventSource: EventSource | undefined

	function closeConnection() {
		eventSource?.close()
		eventSource = undefined
	}

	const connectionRetry = new RetryTimer(() => {
		closeConnection()

		if (!hubIp.value || !hubKey.value) return

		eventSource = new EventSource(`https://${hubIp.value}/eventstream/clip/v2`, {
			headers: {
				"hue-application-key": hubKey.value,
			},
			https: { rejectUnauthorized: false },
			rejectUnauthorized: false,
		})

		eventSource.onmessage = (message) => {
			try {
				const events = JSON.parse(message.data) as HUEEvent[]
				for (const event of events) {
					if (event.type == "update") {
						for (const update of event.data) {
							const wholeId = `philips-hue.${update.id}`
							const light = LightResource.storage.getById(wholeId) as
								| PhilipsHUELight
								| PhilipsHUEGroup
								| undefined
							light?.parseApiState(update)
							const plug = PlugResource.storage.getById(wholeId) as PhilipsHUEPlug | undefined
							plug?.parseApiState(update)

							// if (!light && !plug) {
							// 	console.log("Orphaned Update", wholeId, update)
							// } else if (light) {
							// 	console.log("Update Light", light.config.name)
							// } else if (plug) {
							// 	console.log("Update Plug", plug.config.name)
							// }
						}
					} else if (event.type == "add") {
						if (!hubIp.value || !hubKey.value) return
						injectResourceFromApi(event.data, { hubIp: hubIp.value, hubKey: hubKey.value })
					}
				}
			} catch (err) {}
		}

		eventSource.onerror = (err) => {
			closeConnection()

			connectionRetry.tryAgain()
		}
	}, 60)

	onLoad(async () => {
		await connectionRetry.tryNow()
	})

	onSettingChanged([hubIp, hubKey], async () => {
		await closeConnection()
		await connectionRetry.tryNow()
	})
}
