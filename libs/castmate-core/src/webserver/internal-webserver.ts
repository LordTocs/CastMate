import { Service } from "../util/service"
import express, { Application, Router } from "express"
import http from "http"
import ws from "ws"
import { usePluginLogger } from "../logging/logging"
import { PluginManager } from "../plugins/plugin-manager"
import { EventList } from "../util/events"
import { onLoad, onUnload } from "../plugins/plugin"
import { initingPlugin } from "../plugins/plugin-init"
import { RPCHandler, RPCMessage } from "castmate-ws-rpc"
import { filterPromiseAll } from "castmate-schema"
import HttpProxy from "http-proxy"

function closeHttpServer(httpServer: http.Server | undefined) {
	return new Promise<void>((resolve, reject) => {
		if (httpServer == null) {
			return resolve()
		}
		httpServer.close((err) => {
			if (err) {
				return reject(err)
			}
			resolve()
		})
	})
}

const logger = usePluginLogger("webserver")

interface WebSocketExtras {
	heartbeat: boolean
	call<T extends (...args: any[]) => any>(name: string, ...args: Parameters<T>): Promise<ReturnType<T>>
}

export type ExtendedWebsocket = ws.WebSocket & WebSocketExtras

export type ExtendedServer = ws.Server & {
	readonly clients: ExtendedWebsocket[]
}

export const WebService = Service(
	class {
		private app: Application
		private httpServer: http.Server
		private websocketServer: ExtendedServer
		private routes: Router

		private pingInterval: NodeJS.Timeout
		private rpcs: RPCHandler = new RPCHandler()

		/**
		 * Proxies to run in websocket upgrades
		 */
		private websocketProxies: Record<string, HttpProxy> = {}

		onConnection = new EventList<(socket: ExtendedWebsocket, connectionUrl: URL) => any>()
		onDisconnected = new EventList<(socket: ExtendedWebsocket) => any>()
		onMessage = new EventList<(socket: ExtendedWebsocket, message: any) => any>()

		constructor() {
			this.app = express()
			this.routes = express.Router()

			this.routes.use(express.urlencoded({ extended: false }))
			this.routes.use(express.json())

			this.app.use("/plugins/", this.routes)

			this.httpServer = http.createServer(this.app)
			this.websocketServer = new ws.Server({ noServer: true }) as ExtendedServer

			this.pingInterval = setInterval(() => {
				for (const socket of this.websocketServer.clients) {
					if (socket.heartbeat === false) return socket.terminate()

					socket.heartbeat = false
					socket.ping()
				}
			}, 30000)

			this.websocketServer.on("connection", async (socket, request) => {
				logger.log("Websocket Connection")

				if (!request.url) return

				const requestUrl = new URL(request.url, `http://${request.headers.host}`)

				const expandedSocket: ExtendedWebsocket = Object.assign(socket, {
					heartbeat: true,
					call: async <T extends (...args: any[]) => any>(
						name: string,
						...args: Parameters<T>
					): Promise<ReturnType<T>> => {
						return (await WebService.getInstance().rpcs.call(
							name,
							async (message) => {
								await expandedSocket.send(JSON.stringify(message))
							},
							...args
						)) as any
					},
				} satisfies WebSocketExtras)

				expandedSocket.on("message", (rawData, isBinary) => {
					const dataString = rawData.toString()

					let data: any
					try {
						data = JSON.parse(dataString)
					} catch (err) {
						return
					}

					this.rpcs.handleMessage(
						data as RPCMessage,
						(msg) => expandedSocket.send(JSON.stringify(msg)),
						expandedSocket
					)

					this.onMessage.run(expandedSocket, data)
				})

				expandedSocket.on("pong", async () => {
					expandedSocket.heartbeat = true
				})

				expandedSocket.on("close", async () => {
					this.onDisconnected.run(expandedSocket)
				})

				this.onConnection.run(expandedSocket, requestUrl)
			})

			this.httpServer.on("error", (err) => {
				logger.error("HTTP Error", err)
			})

			this.websocketServer.on("error", async (err) => {
				logger.error("Error", err)
			})
		}

		addPluginRouter(baseName: string, router: express.Router) {
			this.routes.use(baseName, router)
		}

		removePluginRouter(router: express.Router) {
			const idx = this.routes.stack.findIndex((layer) => layer == router)
			if (idx >= 0) {
				this.routes.stack.splice(idx, 1)
			}
		}

		addRootRouter(baseName: string, router: express.Router) {
			this.app.use(baseName, router)
		}

		removeRootRouter(router: express.Router) {
			const idx = this.app.stack.findIndex((layer) => layer == router)
			if (idx >= 0) {
				this.app.stack.splice(idx, 1)
			}
		}

		async startHttp(port: number) {
			this.httpServer.listen(port, () => {
				logger.log("Internal Webserver Started on port", port)
			})
		}

		async startWebsockets() {
			this.httpServer.on("upgrade", async (request, socket, head) => {
				if (!request.url) return

				const url = new URL(request.url, `http://${request.headers.host}`)

				const proxy = this.websocketProxies[url.pathname]
				if (proxy) {
					proxy.ws(request, socket, head)
					return
				}

				this.websocketServer.handleUpgrade(request, socket, head, (socket) => {
					this.websocketServer.emit("connection", socket, request)
				})
			})
		}

		async stop() {
			await closeHttpServer(this.httpServer)
		}

		async updatePort(newPort: number) {
			await closeHttpServer(this.httpServer)

			this.httpServer?.listen(newPort)
		}

		broadcastWebsocketMessage(message: any) {
			if (!this.websocketServer) return

			for (const client of this.websocketServer.clients) {
				client.send(message)
			}
		}

		async broadcastWebsocketRPC<T extends (...args: any[]) => any>(
			name: string,
			...args: Parameters<T>
		): Promise<ReturnType<T>[]> {
			return (await filterPromiseAll(
				this.websocketServer.clients.map((client) =>
					this.rpcs.call(name, (data) => client.send(JSON.stringify(data)), ...args)
				)
			)) as ReturnType<T>[]
		}

		registerRPC<T extends (socket: ExtendedWebsocket, ...args: any[]) => any>(name: string, func: T) {
			this.rpcs.handle(name, func)
		}

		unregisterRPC(name: string) {
			this.rpcs.unhandle(name)
		}

		registerWebsocketProxy(path: string, proxy: HttpProxy) {
			this.websocketProxies[path] = proxy
		}

		unregisterWebsocketProxy(path: string) {
			delete this.websocketProxies[path]
		}
	}
)

export function onWebsocketConnection(func: (socket: ExtendedWebsocket, url: URL) => any) {
	onLoad(() => {
		WebService.getInstance().onConnection.register(func)
	})

	onUnload(() => {
		WebService.getInstance().onConnection.unregister(func)
	})
}

export function onWebsocketDisconnect(func: (socket: ExtendedWebsocket) => any) {
	onLoad(() => {
		WebService.getInstance().onDisconnected.register(func)
	})

	onUnload(() => {
		WebService.getInstance().onDisconnected.unregister(func)
	})
}

export function onWebsocketMessage(func: (socket: ExtendedWebsocket, message: any) => any) {
	onLoad(() => {
		WebService.getInstance().onMessage.register(func)
	})

	onUnload(() => {
		WebService.getInstance().onMessage.unregister(func)
	})
}

export function onWebsocketRPC<T extends (socket: ExtendedWebsocket, ...args: any[]) => any>(name: string, func: T) {
	onLoad(() => {
		WebService.getInstance().registerRPC(name, func)
	})

	onUnload(() => {
		WebService.getInstance().unregisterRPC(name)
	})
}

export function defineWebsocketProxy(path: string, proxy: HttpProxy) {
	onLoad(() => {
		WebService.getInstance().registerWebsocketProxy(path, proxy)
	})

	onUnload(() => {
		WebService.getInstance().unregisterWebsocketProxy(path)
	})
}

export function useHTTPRouter(baseRoute?: string): Router {
	const routeName = baseRoute ?? initingPlugin?.id

	if (!routeName) throw new Error("Supply a route name!")

	const router = express.Router()

	onLoad(() => {
		WebService.getInstance().addPluginRouter(`/${routeName}/`, router)
	})

	onUnload(() => {
		WebService.getInstance().removePluginRouter(router)
	})

	return router
}

/**
 * Don't use this one, use useHTTPRouter(). This is for internal CastMate use
 * @param baseRoute
 */
export function useRootHTTPRouter(baseRoute: string): Router {
	const router = express.Router()

	onLoad(() => {
		WebService.getInstance().addRootRouter(`/${baseRoute}/`, router)
	})

	onUnload(() => {
		WebService.getInstance().removeRootRouter(router)
	})

	return router
}

export function resetRouter(router: Router) {
	router.stack = []
	//@ts-ignore
	router.methods = {}
}
