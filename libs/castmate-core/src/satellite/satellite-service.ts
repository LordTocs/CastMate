import {
	MaybePromise,
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
import http from "http"
import ws, { WebSocket } from "ws"

import { URLPattern } from "urlpattern-polyfill/urlpattern"

//WebRTC connections are maintained out of the renderer process since no good node-webrtc libs exist

const rendererRTCSatelliteConnectionIceCandidate = defineCallableIPC<
	(candidate: SatelliteConnectionICECandidate) => any
>("satellite", "satelliteRTCConnectionIceCandidate")
const rendererRTCSatelliteConnectionRequest = defineCallableIPC<(request: SatelliteConnectionRequest) => any>(
	"satellite",
	"satelliteRTCConnectionRequest"
)
const rendererRTCSatelliteConnectionResponse = defineCallableIPC<(response: SatelliteConnectionResponse) => any>(
	"satellite",
	"satelliteRTCConnectionResponse"
)

const rendererRTCSatelliteSetRTCOptions = defineCallableIPC<(response: SatelliteConnectionOption[]) => any>(
	"satellite",
	"setRTCConnectionOptions"
)

const rendererSendRTCMessage = defineCallableIPC<(id: string, data: string) => any>("satellite", "sendRTCMessage")

/////////////BORROWED FROM express-serve-static-core types/////////////////////////

type RemoveTail<S extends string, Tail extends string> = S extends `${infer P}${Tail}` ? P : S
type GetRouteParameter<S extends string> = RemoveTail<
	RemoveTail<RemoveTail<S, `/${string}`>, `-${string}`>,
	`.${string}`
>

export interface ParamsDictionary {
	[key: string]: string
}

// prettier-ignore
export type RouteParameters<Route extends string> = Route extends `${infer Required}{${infer Optional}}${infer Next}`
    ? ParseRouteParameters<Required> & Partial<ParseRouteParameters<Optional>> & RouteParameters<Next>
    : ParseRouteParameters<Route>;

type ParseRouteParameters<Route extends string> = string extends Route
	? ParamsDictionary
	: Route extends `${string}(${string}`
	? ParamsDictionary // TODO: handling for regex parameters
	: Route extends `${string}:${infer Rest}`
	? (GetRouteParameter<Rest> extends never
			? ParamsDictionary
			: GetRouteParameter<Rest> extends `${infer ParamName}?`
			? { [P in ParamName]?: string } // TODO: Remove old `?` handling when Express 5 is promoted to "latest"
			: { [P in GetRouteParameter<Rest>]: string }) &
			(Rest extends `${GetRouteParameter<Rest>}${infer Next}` ? RouteParameters<Next> : unknown)
	: {}

type SatelliteWebsocketConnectionHandlerBase = (
	socket: WebSocket,
	params: object,
	request: http.IncomingMessage
) => MaybePromise<{ type: string; typeid: string } | undefined | Error>

type SatelliteWebsocketConnectionHandler<Route extends string> = (
	socket: WebSocket,
	params: RouteParameters<Route>,
	request: http.IncomingMessage
) => MaybePromise<{ type: string; typeid: string } | undefined | Error>

interface SatelliteWebsocketConnectionHandlerData {
	pattern: URLPattern
	handler: SatelliteWebsocketConnectionHandlerBase
}

interface BaseSatelliteConnection {
	id: string
	type: string
	typeId: string
	sender: (msg: RPCMessage) => any
}

interface SatelliteRTCConnection extends BaseSatelliteConnection {
	transport: "webrtc"

	remoteService: SatelliteConnectionService
	remoteId: string

	state: "connecting" | "connected" | "disconnected"
}

interface SatelliteWebsocketConnection extends BaseSatelliteConnection {
	transport: "websocket"
	socket: WebSocket
}

type SatelliteConnection = SatelliteRTCConnection | SatelliteWebsocketConnection

function isRTCConnection(connection: unknown): connection is SatelliteRTCConnection {
	if (!connection) return false
	if ((connection as SatelliteConnection).transport == "webrtc") return true
	return false
}

function isRpcType(rpc: string, type: string) {
	if (rpc.startsWith("satellite")) return true
	if (rpc.startsWith(type)) return true

	return false
}

const logger = usePluginLogger("satellite")
export const SatelliteService = Service(
	class {
		onConnection = new EventList<(satelliteId: string) => any>()
		onDisconnected = new EventList<(satelliteId: string) => any>()

		websocketHandlers = new Array<SatelliteWebsocketConnectionHandlerData>()

		private pubsubListening = false

		private pubsubMessageHandler: (plugin: string, event: string, data: object) => any

		private satelliteConnections = new Map<string, SatelliteConnection>()

		getConnection(id: string) {
			return this.satelliteConnections.get(id)
		}

		getCastMateConnection() {
			if (!isSatellite()) throw new Error("This is for satellite only")
			const connection = this.satelliteConnections.keys().next()
			return connection.done ? undefined : connection.value
		}

		private rpcHandler = new RPCHandler()

		startRTCSignalListening() {
			if (this.pubsubListening) return
			logger.log("Starting Satellite Listening")
			this.pubsubListening = true

			PubSubManager.getInstance().registerOnMessage(this.pubsubMessageHandler)
		}

		stopRTCSignalListening() {
			if (!this.pubsubListening) return
			this.pubsubListening = false

			PubSubManager.getInstance().unregisterOnMessage(this.pubsubMessageHandler)
		}

		async setRTCConnectionOptions(options: SatelliteConnectionOption[]) {
			rendererRTCSatelliteSetRTCOptions(options)
		}

		async handleWebsocketConnection(socket: WebSocket, url: URL, request: http.IncomingMessage) {
			const id = nanoid()

			for (const handler of this.websocketHandlers) {
				const match = handler.pattern.exec(url.pathname)
				if (!match) continue

				const result = handler.handler(socket, match.pathname.groups, request)
				if (!result) continue

				if ("type" in result) {
					const connection: SatelliteWebsocketConnection = {
						id,
						transport: "websocket",
						type: result.type,
						typeId: result.typeid,
						socket,
						sender: (msg) => {
							return new Promise<void>((resolve, reject) => {
								try {
									socket.send(JSON.stringify(msg), (err) => {
										if (err) return reject(err)
										resolve()
									})
								} catch (err) {
									reject(err)
								}
							})
						},
					}

					socket.on("message", async (rawData, isBinary) => {
						if (isBinary) return

						const dataString = rawData.toString()

						let data: any
						try {
							data = JSON.parse(dataString)
						} catch (err) {
							return
						}

						const message = data as RPCMessage
						this.rpcHandler.handleMessage(message, (msg) => socket.send(JSON.stringify(msg)), id)
					})

					this.satelliteConnections.set(id, connection)
					await this.onConnection.run(connection.id)

					return true
				}
			}

			return false
		}

		addWebsocketHandler<Route extends string>(route: Route, handler: SatelliteWebsocketConnectionHandler<Route>) {
			this.websocketHandlers.push({
				pattern: new URLPattern(route),
				handler,
			})
		}

		removeWebsocketHandler(handler: SatelliteWebsocketConnectionHandlerBase) {
			const idx = this.websocketHandlers.findIndex((h) => h.handler === handler)
			if (idx < 0) return
			this.websocketHandlers.splice(idx, 1)
		}

		constructor() {
			defineIPCFunc("satellite", "satelliteRTCConnectionRequest", async (request: SatelliteConnectionRequest) => {
				await PubSubManager.getInstance().send("satellite", "satelliteConnectionRequest", request)
			})

			defineIPCFunc(
				"satellite",
				"satelliteRTCConnectionResponse",
				async (response: SatelliteConnectionResponse) => {
					await PubSubManager.getInstance().send("satellite", "satelliteConnectionResponse", response)
				}
			)

			defineIPCFunc(
				"satellite",
				"satelliteRTCConnectionIceCandidate",
				async (candidate: SatelliteConnectionICECandidate) => {
					await PubSubManager.getInstance().send("satellite", "satelliteConnectionIceCandidate", candidate)
				}
			)

			this.pubsubMessageHandler = async (plugin, event, data) => {
				if (plugin != "satellite") return

				if (event == "satelliteConnectionIceCandidate") {
					rendererRTCSatelliteConnectionIceCandidate(data as SatelliteConnectionICECandidate)
				} else if (event == "satelliteConnectionRequest") {
					if (isSatellite()) return
					rendererRTCSatelliteConnectionRequest(data as SatelliteConnectionRequest)
				} else if (event == "satelliteConnectionResponse") {
					if (isCastMate()) return
					rendererRTCSatelliteConnectionResponse(data as SatelliteConnectionResponse)
				}
			}

			defineIPCFunc("satellite", "onRTCConnectionCreated", (connectionInfo: SatelliteConnectionInfo) => {
				this.satelliteConnections.set(connectionInfo.id, {
					...connectionInfo,
					state: "connecting",
					transport: "webrtc",
					sender: (msg) => {
						rendererSendRTCMessage(connectionInfo.id, JSON.stringify(msg))
					},
				})
			})

			defineIPCFunc(
				"satellite",
				"onRTCConnectionStateChange",
				async (id: string, state: "connected" | "connecting" | "disconnected") => {
					const connection = this.satelliteConnections.get(id)
					if (!isRTCConnection(connection)) return

					const newlyConnected = state == "connected" && connection.state == "connecting"
					connection.state = state

					if (newlyConnected) {
						await this.onConnection.run(connection.id)
					}
				}
			)

			defineIPCFunc("satellite", "onRTCConnectionDeleted", async (id: string) => {
				const connection = this.satelliteConnections.get(id)
				if (!isRTCConnection(connection)) return

				await this.onDisconnected.run(id)
				this.satelliteConnections.delete(id)
			})

			defineIPCFunc("satellite", "onRTCControlMessage", (id: string, data: object) => {
				//TODO
				try {
					const connection = this.satelliteConnections.get(id)
					if (!isRTCConnection(connection)) return

					this.rpcHandler.handleMessage(data as RPCMessage, connection.sender, id)
				} catch (err) {
					logger.error("CONTROL MESSAGE ERROR", err)
				}
			})
		}

		async callSatelliteRPC<T extends (...args: any[]) => any>(
			connectionId: string,
			type: string,
			name: string,
			...args: Parameters<T>
		) {
			const connection = this.satelliteConnections.get(connectionId)

			if (!connection) return

			return (await this.rpcHandler.call(`${type}_${name}`, connection.sender, ...args)) as ReturnType<T>
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

export function handleSatelliteWebsocketConnection<Route extends string>(
	route: Route,
	handler: SatelliteWebsocketConnectionHandler<Route>
) {
	onLoad(() => {
		SatelliteService.getInstance().addWebsocketHandler(route, handler)
	})

	onUnload(() => {
		SatelliteService.getInstance().removeWebsocketHandler(handler)
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

export function onSatelliteRPC<T extends (satelliteId: string, ...args: any[]) => any>(
	type: string,
	name: string,
	func: T
) {
	onLoad(() => {
		SatelliteService.getInstance().registerRPC(`${type}_${name}`, func)
	})

	onUnload(() => {
		SatelliteService.getInstance().unregisterRPC(`${type}_${name}`)
	})
}
