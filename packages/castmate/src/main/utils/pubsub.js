import axios from "axios"
import { EventEmitter, WebSocket } from "ws"
import { StateManager } from "../state/state-manager"
import logger from "./logger"
import util, { inspect } from "util"
import { onStateChange } from "../state/reactive"

import { WebPubSubClient } from "@azure/web-pubsub-client"

const baseUrl = import.meta.env.VITE_SPELLCAST_URL

let castMatePubSub = null
export class CastMatePubSub extends EventEmitter {
	constructor() {
		super()
		this.azsocket = null
		this.reconnectDelay = 5
		this.maxReconnectDelay = 60
		this.shouldConnect = false
		this.connected = false
		this.connecting = false
	}

	/**
	 *
	 * @returns {CastMatePubSub}
	 */
	static getInstance() {
		if (!castMatePubSub) {
			castMatePubSub = new CastMatePubSub()
		}
		return castMatePubSub
	}

	stop() {
		this._disconnect()
		this.shouldConnect = false
	}

	start() {
		this._setupTokenWatch()
		this.shouldConnect = true
		this._connect()
	}

	/**
	 *
	 * @param {string} plugin
	 * @param {string} event
	 * @param {Record<string, any>} data
	 */
	async send(plugin, event, data) {
		const eventName = `${plugin}_${event}`
		console.log(`Sending PubSub ${eventName}:`, data)

		if (this.connected) {
			await this.azsocket?.sendEvent(eventName, data, "json")
		} else {
			logger.warn(
				`Tried to send PubSub event before connection was complete.`
			)
		}
	}

	get accessToken() {
		return StateManager.getInstance().rootState?.twitch?.accessToken
	}

	_setupTokenWatch() {
		if (this.tokenWatcher) {
			return
		}

		this.tokenWatcher = onStateChange(
			StateManager.getInstance().rootState?.twitch,
			"accessToken",
			() => this._onTokenChange
		)
	}

	_onTokenChange() {
		this._disconnect()

		if (!this.accessToken) {
			this.connecting = true
			return
		}

		this._connect()
	}

	_checkEvents() {
		let total = 0
		const ignoreEvents = ["connected", "disconnected"]

		for (let name of this.eventNames()) {
			if (ignoreEvents.includes(ignoreEvents)) {
				continue
			}
			console.log("Events in ", name)
			total += this.listenerCount(name)
		}
		if (total > 0) {
			this.start()
		} else {
			this.stop()
		}
	}

	async _connect() {
		if (!this.shouldConnect) {
			return
		}

		if (!this.accessToken) {
			this.connecting = false
			return
		}

		if (this.connecting) {
			return
		}

		if (this.connected) {
			return
		}

		if (!baseUrl) {
			logger.warn("Missing PubSub Negotiation Url")
			this.connecting = false
			return
		}

		try {
			await this._connectInternal()
		} catch (err) {
			logger.error("Error Trying to Connect to CastMate PubSub")
			logger.error(util.inspect(err))
		}
	}

	async _connectInternal() {
		console.log("---------CONNECT INTERNAL--------------")
		this.connecting = true

		const result = await axios.get(`/pubsub/negotiate`, {
			baseURL: baseUrl,
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
		})

		const { url } = result.data

		if (this.azsocket) {
			logger.warn(`Double CastMate PubSub Connect Detected`)
			this.azsocket.stop()
			this.azsocket = null
		}

		//console.log("Connection URL", url)

		this.azsocket = new WebPubSubClient(url, {
			autoReconnect: true,
			reconnectRetryOptions: {
				maxRetries: 100000,
				retryDelayInMs: 1000,
				maxRetryDelayInMs: 60000,
				mode: "Exponential",
			},
		})

		this.azsocket.on("server-message", (ev) => {
			console.log("SERVER MESSAGE!", ev.message.sequenceId)
			const { plugin, event, context } = ev.message.data

			this.emit(`${plugin}.${event}`, context)
		})

		this.azsocket.on("connected", (ev) => {
			logger.info(
				`Connected to CastMate PubSub as ${ev.userId}:${ev.connectionId}`
			)
			this.connected = true
			process.nextTick(() => this.emit("connected"))
		})

		this.azsocket.on("disconnected", (ev) => {
			logger.warn(
				`Lost Connection to CastMate PubSub ${util.inspect(ev.message)}`
			)
			process.nextTick(() => this.emit("disconnected"))
			this.connected = false
			this.connecting = false
		})

		await this.azsocket.start()
	}

	_disconnect() {
		if (this.azsocket) {
			this.azsocket.stop()
			this.azsocket = null
		}
		this.connected = false
		this.connecting = false
	}

	///EVENT LISTENER HOOKS

	//Always count the number of listeners, if we don't have any listners there's no sense connecting to the pubsub.

	/**
	 *
	 * @param {string | symbol} event
	 * @param {(...args: any[]) => any} listener
	 */
	addListener(event, listener) {
		this.on(event, listener)
	}

	/**
	 *
	 * @param {string | symbol} event
	 * @param {(...args: any[]) => any} listener
	 */
	once(event, listener) {
		throw new Error("NO!")
	}

	/**
	 *
	 * @param {string | symbol} event
	 * @param {(...args: any[]) => any} listener
	 */
	on(event, listener) {
		console.log("Register", event)
		super.on(event, listener)
		this._checkEvents()
	}

	/**
	 *
	 * @param {string | symbol} event
	 * @param {(...args: any[]) => any} listener
	 */
	removeListener(event) {
		super.removeListener(event, listener)
		this._checkEvents()
	}
}
