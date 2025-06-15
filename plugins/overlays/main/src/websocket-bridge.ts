import {
	Service,
	onWebsocketRPC,
	ExtendedWebsocket,
	onWebsocketDisconnect,
	autoRerun,
	PluginManager,
	onWebsocketConnection,
	ReactiveEffect,
	useHTTPRouter,
	useRootHTTPRouter,
	usePluginLogger,
	defineWebsocketProxy,
	onLoad,
	onUnload,
	handleSatelliteWebsocketConnection,
	SatelliteService,
	onSatelliteRPC,
} from "castmate-core"
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { Overlay } from "./overlay-resource"
import * as express from "express"
import { app } from "electron"
import HttpProxy from "http-proxy"
import { OverlayConfigEvaluator, createOverlayEvaluator } from "./config-evaluation"

const logger = usePluginLogger("overlays")

interface OverlayStateUpdater {
	plugin: string
	state: string
	reactiveEffect: ReactiveEffect
	socket: ExtendedWebsocket
}

interface OpenOverlayData {
	sockets: ExtendedWebsocket[]
	evaluator: OverlayConfigEvaluator
}

type WidgetRPCHandler = (overlay: Overlay, widgetId: string, ...args: any[]) => any

export const OverlayWebsocketService = Service(
	class {
		private stateUpdaters = new Map<ExtendedWebsocket, OverlayStateUpdater[]>()
		private openOverlays = new Map<string, OpenOverlayData>()
		private socketToOverlay = new Map<ExtendedWebsocket, string>()

		private widgetRPCs = new Map<string, WidgetRPCHandler>()

		async onConnection(socket: ExtendedWebsocket, url: URL) {
			const overlayId = url.searchParams.get("overlay")
			if (overlayId == null) return

			const overlay = Overlay.storage.getById(overlayId)
			if (overlay == null) return

			logger.log("Overlay Websocket Connected", overlay.id)

			this.stateUpdaters.set(socket, [])

			let openData = this.openOverlays.get(overlayId)

			if (openData) {
				openData.sockets.push(socket)

				await socket.call<(config: OverlayConfig) => any>("overlays_setConfig", openData.evaluator.remoteConfig)

				logger.log(`Existing Open Data "${overlayId}"`)
			} else {
				openData = {
					sockets: [socket],
					evaluator: await createOverlayEvaluator(overlay.config, async (resolvedConfig) => {
						if (!openData) return
						for (const socket of openData.sockets) {
							await socket.call<(config: OverlayConfig) => any>("overlays_setConfig", resolvedConfig)
						}
					}),
				}

				await socket.call<(config: OverlayConfig) => any>("overlays_setConfig", openData.evaluator.remoteConfig)

				this.openOverlays.set(overlayId, openData)
			}

			this.socketToOverlay.set(socket, overlayId)
		}

		async onDisconnect(socket: ExtendedWebsocket) {
			const updaters = this.stateUpdaters.get(socket)

			if (updaters) {
				for (const updater of updaters) {
					updater.reactiveEffect.dispose()
				}
			}

			const overlayId = this.socketToOverlay.get(socket)

			if (!overlayId) return

			logger.log("Overlay Websocket Disconnected", overlayId)

			const openData = this.openOverlays.get(overlayId)
			if (openData) {
				const idx = openData.sockets.findIndex((s) => s === socket)
				if (idx >= 0) {
					openData.sockets.splice(idx)
				}

				if (openData.sockets.length == 0) {
					openData.evaluator.effect?.dispose()
					this.openOverlays.delete(overlayId)
				}
			}

			this.socketToOverlay.delete(socket)
			this.stateUpdaters.delete(socket)
		}

		async acquireState(socket: ExtendedWebsocket, plugin: string, state: string) {
			const updaters = this.stateUpdaters.get(socket)
			if (updaters == null) return
			if (updaters.find((u) => u.plugin == plugin && u.state == state)) return

			updaters.push({
				plugin,
				state,
				socket,
				reactiveEffect: await autoRerun(() => {
					socket.call<(plugin: string, state: string, value: any) => any>(
						"overlays_stateUpdate",
						plugin,
						state,
						PluginManager.getInstance().getState(plugin, state)?.ref?.value
					)
				}),
			})
		}

		async freeState(socket: ExtendedWebsocket, plugin: string, state: string) {
			const updaters = this.stateUpdaters.get(socket)

			if (updaters == null) return

			const idx = updaters.findIndex((u) => u.plugin == plugin && u.state == state)
			if (idx < 0) return

			updaters[idx].reactiveEffect.dispose()

			updaters.splice(idx, 1)
		}

		async overlayConfigChanged(id: string) {
			//logger.log(`Overlay Config Updated "${id}"`)

			const sockets = this.openOverlays.get(id)
			if (!sockets) return

			//logger.log("Sockets Found", id)

			const overlay = Overlay.storage.getById(id)
			if (!overlay) return

			//logger.log("Triggering", id, sockets.evaluator.effect)

			sockets.evaluator.effect?.trigger()
		}

		async callOverlayRPC<T extends (...args: any[]) => any = (...args: any[]) => any>(
			widgetId: string,
			rpcId: string,
			...args: Parameters<T>
		) {
			for (const overlay of Overlay.storage) {
				const widget = overlay.config.widgets.find((w) => w.id == widgetId)
				if (!widget) continue

				const openSockets = this.openOverlays.get(overlay.id)
				if (!openSockets) return []

				const calls = openSockets.sockets.map((s) => s.call("overlays_widgetRPC", widgetId, rpcId, ...args))

				//logger.log("Calling", widgetId, rpcId, "on", calls.length, "sockets")

				const results = await Promise.allSettled(calls)

				const successes = results.filter((r): r is PromiseFulfilledResult<any> => r.status == "fulfilled")

				return successes.map((s) => s.value as ReturnType<T>)
			}

			return []
		}

		async sendOverlayMessage(messageId: string, ...args: any[]) {
			const calls = new Array<Promise<any>>()

			for (const [id, overlay] of this.openOverlays) {
				calls.push(...overlay.sockets.map((s) => s.call("overlays_broadcast", messageId, ...args)))
			}

			await Promise.allSettled(calls)
		}

		handleWidgetRPC(id: string, func: WidgetRPCHandler) {
			this.widgetRPCs.set(id, func)
		}

		unhandleWidgetRPC(id: string) {
			this.widgetRPCs.delete(id)
		}

		async handleWidgetRPCRequest(socket: ExtendedWebsocket, id: string, from: string, ...args: any[]) {
			const overlayId = this.socketToOverlay.get(socket)
			if (!overlayId) throw new Error("Unknown Overlay")
			const overlay = Overlay.storage.getById(overlayId)
			if (!overlay) throw new Error("Unknown Overlay")

			const handler = this.widgetRPCs.get(id)
			if (!handler) throw new Error("Unbound RPC")
			return await handler(overlay, from, ...args)
		}
	}
)

export function setupWebsockets() {
	handleSatelliteWebsocketConnection("/overlays/:overlayId", (socket, params, request) => {
		const overlay = Overlay.storage.getById(params.overlayId)
		if (!overlay) return undefined

		return { type: "overlay", typeid: params.overlayId }
	})

	OverlayWebsocketService.initialize()

	const router = useRootHTTPRouter("overlays")

	router.get("/:id/config", async (req, res, next) => {
		const overlay = Overlay.storage.getById(req.params.id)

		if (!overlay) {
			return res.status(404).send()
		}

		res.send(overlay.config)
	})

	if (app.isPackaged) {
		onLoad(() => {
			logger.log("Serving Overlays Statically")
		})
		//Serve the static files for the SPA app built by castmate-obs-overlay package
		router.get("/:id", (req, res, next) => {
			const overlay = Overlay.storage.getById(req.params.id)

			if (!overlay) {
				return res.status(404).send()
			}

			res.sendFile("overlay.html", { root: "./obs-overlay" })
		})

		router.use(express.static("./obs-overlay"))
	} else {
		onLoad(() => {
			logger.log("Proxying Overlays from http://localhost:5174")
		})

		//If we're unpackaged that means we've started with yarn run dev.
		//We can't serve static files, but instead need to forward requests to vite's dev server
		//That way changes and HMR works through the regular URLs provided to OBS.
		const devProxy = HttpProxy.createProxyServer({
			target: "http://localhost:5174/overlays/", //This address is fixed because we set it in mvite
		})

		defineWebsocketProxy("/overlays/", devProxy)

		devProxy.on("error", (err) => {
			logger.error("Dev Proxy Error:", err)
		})

		router.get(`/:id`, (req, res, next) => {
			const overlay = Overlay.storage.getById(req.params.id)
			if (!overlay) {
				return next()
			}

			//Serve overlay.html
			devProxy.web(req, res, {
				ignorePath: true,
				target: "http://localhost:5174/overlays/overlay.html", //This address is fixed because we set it in mvite
			})
		})

		router.get("*", (req, res, next) => {
			//Try to get the file from the dev server
			devProxy.web(req, res, {}, (err) => {
				next(err)
			})
		})
	}
}

export function handleWidgetRPC<T extends WidgetRPCHandler>(id: string, func: T) {
	onSatelliteRPC("overlays_wrpc", id, async (connectionId: string, ...args: any[]) => {
		const connection = SatelliteService.getInstance().getConnection(connectionId)
		if (connection?.type != "overlay") throw new Error("Not an overlay")

		const overlay = Overlay.storage.getById(connection.typeId)
		if (!overlay) throw new Error("Missing Overlay!")

		return await func(overlay)
	})
}
