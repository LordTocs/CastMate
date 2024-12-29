import {
	SatelliteConnectionICECandidate,
	SatelliteConnectionInfo,
	SatelliteConnectionOption,
	SatelliteConnectionRequest,
	SatelliteConnectionResponse,
	SatelliteConnectionService,
} from "castmate-schema"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { Service } from "../util/service"
import { PubSubManager } from "../pubsub/pubsub-service"
import { usePluginLogger } from "../logging/logging"
import { RPCHandler, RPCMessage } from "castmate-ws-rpc"
import { onLoad, onUnload } from "../plugins/plugin"
import { EventList } from "../util/events"
import { SatelliteResourceConstructor } from "./satellite-resource"
import { nanoid } from "nanoid/non-secure"
import { Resource } from "../resources/resource"
import { isCastMate, isSatellite } from "../util/init-mode"

//WebRTC connections are maintained out of the renderer process since no good node-webrtc libs exist

const rendererSatelliteConnectionIceCandidate = defineCallableIPC<(candidate: SatelliteConnectionICECandidate) => any>(
	"satellite",
	"satelliteConnectionIceCandidate"
)
const rendererSatelliteConnectionRequest = defineCallableIPC<(request: SatelliteConnectionRequest) => any>(
	"satellite",
	"satelliteConnectionRequest"
)
const rendererSatelliteConnectionResponse = defineCallableIPC<(response: SatelliteConnectionResponse) => any>(
	"satellite",
	"satelliteConnectionResponse"
)

const rendererSatelliteSetRTCOptions = defineCallableIPC<(response: SatelliteConnectionOption[]) => any>(
	"satellite",
	"setRTCConnectionOptions"
)

const rendererSendRTCMessage = defineCallableIPC<(id: string, data: string) => any>("satellite", "sendRTCMessage")

interface RendererRTCConnection {
	id: string

	remoteService: SatelliteConnectionService
	remoteId: string
	type: string
	typeId: string

	state: "connecting" | "connected" | "disconnected"
}

const logger = usePluginLogger("satellite")
export const SatelliteService = Service(
	class {
		onConnection = new EventList<(satelliteId: string) => any>()
		onDisconnected = new EventList<(satelliteId: string) => any>()

		private pubsubListening = false

		private pubsubMessageHandler: (plugin: string, event: string, data: object) => any

		private rtcConnections = new Map<string, RendererRTCConnection>()

		getConnection(id: string) {
			return this.rtcConnections.get(id)
		}

		getCastMateConnection() {
			if (!isSatellite()) throw new Error("This is for satellite only")
			const connection = this.rtcConnections.keys().next()
			return connection.done ? undefined : connection.value
		}

		private rpcHandler = new RPCHandler()

		startListening() {
			if (this.pubsubListening) return
			logger.log("Starting Satellite Listening")
			this.pubsubListening = true

			PubSubManager.getInstance().registerOnMessage(this.pubsubMessageHandler)
		}

		stopListening() {
			if (!this.pubsubListening) return
			this.pubsubListening = false

			PubSubManager.getInstance().unregisterOnMessage(this.pubsubMessageHandler)
		}

		async setRTCConnectionOptions(options: SatelliteConnectionOption[]) {
			rendererSatelliteSetRTCOptions(options)
		}

		constructor() {
			defineIPCFunc("satellite", "satelliteConnectionRequest", async (request: SatelliteConnectionRequest) => {
				await PubSubManager.getInstance().send("satellite", "satelliteConnectionRequest", request)
			})

			defineIPCFunc("satellite", "satelliteConnectionResponse", async (response: SatelliteConnectionResponse) => {
				await PubSubManager.getInstance().send("satellite", "satelliteConnectionResponse", response)
			})

			defineIPCFunc(
				"satellite",
				"satelliteConnectionIceCandidate",
				async (candidate: SatelliteConnectionICECandidate) => {
					await PubSubManager.getInstance().send("satellite", "satelliteConnectionIceCandidate", candidate)
				}
			)

			this.pubsubMessageHandler = async (plugin, event, data) => {
				if (plugin != "satellite") return

				if (event == "satelliteConnectionIceCandidate") {
					rendererSatelliteConnectionIceCandidate(data as SatelliteConnectionICECandidate)
				} else if (event == "satelliteConnectionRequest") {
					if (isSatellite()) return
					rendererSatelliteConnectionRequest(data as SatelliteConnectionRequest)
				} else if (event == "satelliteConnectionResponse") {
					if (isCastMate()) return
					rendererSatelliteConnectionResponse(data as SatelliteConnectionResponse)
				}
			}

			defineIPCFunc("satellite", "onConnectionCreated", (connectionInfo: SatelliteConnectionInfo) => {
				this.rtcConnections.set(connectionInfo.id, { ...connectionInfo, state: "connecting" })
			})

			defineIPCFunc(
				"satellite",
				"onConnectionStateChange",
				async (id: string, state: "connected" | "connecting" | "disconnected") => {
					const connection = this.rtcConnections.get(id)
					if (!connection) return

					const newlyConnected = state == "connected" && connection.state == "connecting"
					connection.state = state

					if (newlyConnected) {
						await this.onConnection.run(connection.id)
					}
				}
			)

			defineIPCFunc("satellite", "onConnectionDeleted", async (id: string) => {
				if (this.rtcConnections.has(id)) {
					await this.onDisconnected.run(id)
					this.rtcConnections.delete(id)
				}
			})

			defineIPCFunc("satellite", "onControlMessage", (id: string, data: object) => {
				//TODO
				try {
					const connection = this.rtcConnections.get(id)
					if (!connection) return

					this.rpcHandler.handleMessage(
						data as RPCMessage,
						(msg) => rendererSendRTCMessage(id, JSON.stringify(msg)),
						id
					)
				} catch (err) {
					logger.error("CONTROL MESSAGE ERROR", err)
				}
			})
		}

		async callSatelliteRPC<T extends (...args: any[]) => any>(id: string, name: string, ...args: Parameters<T>) {
			const connection = this.rtcConnections.get(id)

			if (!connection) return

			return (await this.rpcHandler.call(
				name,
				(msg) => rendererSendRTCMessage(id, JSON.stringify(msg)),
				...args
			)) as ReturnType<T>
		}

		registerRPC<T extends (id: string, ...args: any[]) => any>(name: string, func: T) {
			this.rpcHandler.handle(name, func)
		}

		unregisterRPC(name: string) {
			this.rpcHandler.unhandle(name)
		}
	}
)

export function onSatelliteConnection(func: (satelliteId: string) => any) {
	onLoad(() => {
		SatelliteService.getInstance().onConnection.register(func)
	})

	onUnload(() => {
		SatelliteService.getInstance().onConnection.unregister(func)
	})
}

export function onSatelliteDisconnect(func: (satelliteId: string) => any) {
	onLoad(() => {
		SatelliteService.getInstance().onDisconnected.register(func)
	})

	onUnload(() => {
		SatelliteService.getInstance().onDisconnected.unregister(func)
	})
}

export function onSatelliteRPC<T extends (satelliteId: string, ...args: any[]) => any>(name: string, func: T) {
	onLoad(() => {
		SatelliteService.getInstance().registerRPC(name, func)
	})

	onUnload(() => {
		SatelliteService.getInstance().unregisterRPC(name)
	})
}
