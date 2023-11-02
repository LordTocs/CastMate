import { ReactiveRef, RetryTimer, onLoad, onSettingChanged } from "castmate-core"
import EventSource from "eventsource"
import { HUEApiLight } from "./api"
import { LightResource, PlugResource } from "castmate-plugin-iot-main"
import { PhilipsHUELight, PhilipsHUEPlug, injectResourceFromApi } from "./resources"

interface HUEUpdateEvent {
	type: "update"
	data: HUEApiLight
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
				const messageData = JSON.parse(message.data)
				if (!Array.isArray(messageData)) return
				const events = messageData as HUEEvent[]
				for (const event of events) {
					//console.log("HUE EVENT", event)
					if (event.type == "update") {
						const light = LightResource.storage.getById(`philips-hue.${event.data.id}`) as
							| PhilipsHUELight
							| undefined
						light?.parseApiState(event.data)
						const plug = PlugResource.storage.getById(`philips-hue.${event.data.id}`) as
							| PhilipsHUEPlug
							| undefined
						plug?.parseApiState(event.data)
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
