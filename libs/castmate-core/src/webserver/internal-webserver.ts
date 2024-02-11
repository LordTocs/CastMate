import { Service } from "../util/service"
import express, { Application, Router } from "express"
import http from "http"
import ws from "ws"
import { usePluginLogger } from "../logging/logging"
import { PluginManager } from "../plugins/plugin-manager"
import { EventList } from "../util/events"
import { onLoad, onUnload } from "../plugins/plugin"
import { initingPlugin } from "../plugins/plugin-init"

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

export const WebService = Service(
	class {
		private app: Application
		private httpServer: http.Server
		private websocketServer: ws.Server
		private routes: Router

		onConnection = new EventList<(socket: ws.WebSocket) => any>()
		onMessage = new EventList<(socket: ws.WebSocket, message: any) => any>()

		constructor() {
			this.app = express()
			this.routes = express.Router()

			this.routes.use(express.urlencoded({ extended: false }))
			this.routes.use(express.json())

			this.app.use("/plugins/", this.routes)

			this.httpServer = http.createServer(this.app)
			this.websocketServer = new ws.Server({ noServer: true })

			this.websocketServer.on("connection", async (socket, request) => {
				logger.log("Websocket Connection")

				socket.on("message", (rawData, isBinary) => {
					if (isBinary || typeof rawData != "string") return

					let data: any
					try {
						data = JSON.parse(rawData)
					} catch (err) {
						return
					}

					this.onMessage.run(socket, data)
				})

				this.onConnection.run(socket)
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

		async startHttp(port: number) {
			this.httpServer.listen(port, () => {
				logger.log("Internal Webserver Started on port", port)
			})
		}

		async startWebsockets() {
			this.httpServer.on("upgrade", async (request, socket, head) => {
				if (!request.url) return

				const url = new URL(request.url, `http://${request.headers.host}`)

				//TODO: Proxy url?

				this.websocketServer.handleUpgrade(request, socket, head, (socket) => {})
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
	}
)

export function onWebsocketConnection(func: (socket: ws.WebSocket) => any) {
	onLoad(() => {
		WebService.getInstance().onConnection.register(func)
	})

	onUnload(() => {
		WebService.getInstance().onConnection.unregister(func)
	})
}

export function onWebsocketMessage(func: (socket: ws.WebSocket, message: any) => any) {
	onLoad(() => {
		WebService.getInstance().onMessage.register(func)
	})

	onUnload(() => {
		WebService.getInstance().onMessage.unregister(func)
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

export function resetRouter(router: Router) {
	router.stack = []
	//@ts-ignore
	router.methods = {}
}
