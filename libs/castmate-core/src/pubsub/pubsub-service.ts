import { WebPubSubClient } from "@azure/web-pubsub-client"
import { Service } from "../util/service"
import { usePluginLogger } from "../logging/logging"
import axios from "axios"
import { isObject } from "castmate-schema"
import { EventList } from "../util/events"
import { onLoad, onUnload } from "../plugins/plugin"
import { initingPlugin } from "../plugins/plugin-init"
import { ReactiveEffect, autoRerun } from "../reactivity/reactivity"
import { coreAxios } from "../util/request-utils"

const logger = usePluginLogger("pubsub")

const baseURL = "https://api.spellcast.gg/"

/**
 * PubSubManager connects to the azure-pubsub allowing realtime events from the cloud.
 */
export const PubSubManager = Service(
	class {
		private azSocket: WebPubSubClient | undefined = undefined
		private token: string | undefined
		private connected = false
		private connecting = false
		private shouldConnect = false

		private onMessage = new EventList<(plugin: string, event: string, context: object) => any>()

		private onConnect = new EventList()

		constructor() {}

		setToken(token: string | undefined) {
			logger.log("Cloud PubSub Received Auth Token")
			this.token = token

			this.disconnect()

			if (!this.token) {
				this.connecting = false
				return
			}

			this.connect()
		}

		start() {
			logger.log("Starting PubSub Connection")
			this.shouldConnect = true
			this.connect()
		}

		stop() {
			logger.log("Stopping PubSub Connection")
			this.shouldConnect = false
			this.disconnect()
		}

		private disconnect() {
			if (this.azSocket) {
				logger.log("Disconnecting from Cloud PubSub")
				this.azSocket?.stop()
				this.azSocket = undefined
			}

			this.connected = false
			this.connecting = false
		}

		private async connect() {
			if (!this.shouldConnect) return
			if (!this.token) return
			if (this.connecting) return
			if (this.connected) return

			if (!baseURL) {
				logger.error("Missing PubSub Negotiation Url")
				return
			}

			try {
				await this.connectInternal()
			} catch (err) {
				logger.error("Failed to Connect to Cloud PubSub")
				logger.error(err)
			}
		}

		private async connectInternal() {
			logger.log("Starting Cloud PubSub Connection")
			this.connecting = true

			const negotiationResp = await coreAxios.get("/pubsub/negotiate", {
				baseURL,
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
			})

			const url = negotiationResp.data.url as string

			if (!url) throw new Error("Negotiation Response didn't contain URL!")

			if (this.azSocket) {
				logger.error("Double CastMate PubSub connection detected!!")
				this.azSocket.stop()
				this.azSocket = undefined
			}

			this.azSocket = new WebPubSubClient(url, {
				autoReconnect: true,
				reconnectRetryOptions: {
					maxRetries: 1000000,
					retryDelayInMs: 1000,
					maxRetryDelayInMs: 60000,
					mode: "Exponential",
				},
			})

			this.azSocket.on("server-message", (ev) => {
				if (ev.message.dataType != "json") return
				if (!isObject(ev.message.data)) return

				const messageData = ev.message.data as {
					plugin: string
					message: string
					context: object
				}

				this.onMessage.run(messageData.plugin, messageData.message, messageData.context)
			})

			this.azSocket.on("connected", async (ev) => {
				logger.log(`Connected to CastMate PubSub as ${ev.userId}:${ev.connectionId}`)
				this.connected = true
				await this.onConnect.run()
			})

			this.azSocket.on("disconnected", (ev) => {
				logger.error("Lost Connection to CastMate Pubsub", ev.message)

				//ON DISCONNECT

				this.connected = false
				this.connecting = false
			})

			await this.azSocket.start()
		}

		async send(plugin: string, event: string, data: object) {
			const eventName = `${plugin}_${event}`

			if (!this.azSocket) {
				logger.error("Tried to send", eventName, "without pubsub connection")
				return
			}

			if (!this.connected) {
				logger.error("Tried to send ", eventName, "before pubsub connection")
				return
			}

			try {
				await this.azSocket.sendEvent(eventName, data, "json")
			} catch (err) {
				logger.error("Cloud PubSub Error", err)
			}
		}

		private checkEvents() {
			if (this.onMessage.handlerCount == 0) {
				this.stop()
			} else {
				this.start()
			}
		}

		registerOnMessage(func: (plugin: string, event: string, context: object) => any) {
			this.onMessage.register(func)
			this.checkEvents()
		}

		unregisterOnMessage(func: (plugin: string, event: string, context: object) => any) {
			if (!this.onMessage.unregister(func)) {
				logger.error("Failed to unregister", func)
			}
			this.checkEvents()
		}

		registerOnConnect(func: () => any) {
			this.onConnect.register(func)
		}

		unregisterOnConnect(func: () => any) {
			this.onConnect.unregister(func)
		}
	}
)

/**
 * Watches for Azure PubSub messages, comes with reactive function to dynamically register and unregister the events.
 * This dynamic registration is so we can connect to the pubsub ONLY when we need it. PubSub connections are costly
 * If someone isn't actively using spellcast or another cloud integration, there's no reason for them to be connected.
 *
 * @param eventName
 * @param func
 * @param activeFunc Reactively watched function to dynamically register and unregister the onMessage function.
 */
export function onCloudPubSubMessage<T extends object>(
	eventName: string,
	activeFunc: () => boolean,
	func: (data: T) => any
) {
	if (!initingPlugin) throw new Error()
	const pluginId = initingPlugin.id

	const handler = async (plugin: string, event: string, context: object) => {
		if (plugin != pluginId) return
		if (event != eventName) return

		return await func(context as T)
	}

	let registered = false
	let registrationWatcher: ReactiveEffect | undefined = undefined

	onLoad(async () => {
		registrationWatcher = await autoRerun(() => {
			if (activeFunc()) {
				if (!registered) {
					registered = true
					PubSubManager.getInstance().registerOnMessage(handler)
				}
			} else {
				if (registered) {
					registered = false
					PubSubManager.getInstance().unregisterOnMessage(handler)
				}
			}
		})
	})

	onUnload(() => {
		if (registered) {
			PubSubManager.getInstance().unregisterOnMessage(handler)
			registrationWatcher?.dispose()
			registered = false
		}
	})
}

export function onCloudPubSubConnect(func: () => any) {
	onLoad(() => {
		PubSubManager.getInstance().registerOnConnect(func)
	})

	onUnload(() => {
		PubSubManager.getInstance().unregisterOnConnect(func)
	})
}

export function useSendCloudPubSubMessage<T extends object>(eventName: string) {
	if (!initingPlugin) throw new Error()
	const pluginId = initingPlugin.name

	return async (data: T) => {
		return await PubSubManager.getInstance().send(pluginId, eventName, data)
	}
}
