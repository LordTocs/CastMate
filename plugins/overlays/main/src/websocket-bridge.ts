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

export const OverlayWebsocketService = Service(
	class {
		private stateUpdaters = new Map<ExtendedWebsocket, OverlayStateUpdater[]>()
		private openOverlays = new Map<string, OpenOverlayData>()
		private socketToOverlay = new Map<ExtendedWebsocket, string>()

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
						logger.log("Updating State!")
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
			logger.log(`Overlay Config Updated "${id}"`)

			const sockets = this.openOverlays.get(id)
			if (!sockets) return

			logger.log("Sockets Found", id)

			const overlay = Overlay.storage.getById(id)
			if (!overlay) return

			logger.log("Triggering", id, sockets.evaluator.effect)

			sockets.evaluator.effect?.trigger()
		}

		async callOverlayRPC(widgetId: string, rpcId: string, ...args: any[]) {
			for (const overlay of Overlay.storage) {
				const widget = overlay.config.widgets.find((w) => w.id == widgetId)
				if (!widget) continue

				const openSockets = this.openOverlays.get(overlay.id)
				if (!openSockets) return

				const calls = openSockets.sockets.map((s) => s.call("overlays_widgetRPC", widgetId, rpcId, ...args))

				logger.log("Calling", widgetId, rpcId, "on", calls.length, "sockets")

				await Promise.allSettled(calls)
			}
		}

		async sendOverlayMessage(messageId: string, ...args: any[]) {
			const calls = new Array<Promise<any>>()

			for (const [id, overlay] of this.openOverlays) {
				calls.push(...overlay.sockets.map((s) => s.call("overlays_broadcast", messageId, ...args)))
			}

			await Promise.allSettled(calls)
		}
	}
)

export function setupWebsockets() {
	OverlayWebsocketService.initialize()

	onWebsocketConnection(async (socket, url) => {
		await OverlayWebsocketService.getInstance().onConnection(socket, url)
	})

	onWebsocketDisconnect(async (socket) => {
		await OverlayWebsocketService.getInstance().onDisconnect(socket)
	})

	onWebsocketRPC("overlays_acquireState", async (socket, plugin: string, state: string) => {
		await OverlayWebsocketService.getInstance().acquireState(socket, plugin, state)
	})

	onWebsocketRPC("overlays_freeState", async (socket, plugin: string, state: string) => {
		await OverlayWebsocketService.getInstance().freeState(socket, plugin, state)
	})

	const router = useRootHTTPRouter("overlays")

	router.get("/:id/config", async (req, res, next) => {
		const overlay = Overlay.storage.getById(req.params.id)

		if (!overlay) {
			return res.status(404).send()
		}

		res.send(overlay.config)
	})

	if (app.isPackaged) {
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
		//If we're unpackaged that means we've started with yarn run dev.
		//We can't serve static files, but instead need to forward requests to vite's dev server
		//That way changes and HMR works through the regular URLs provided to OBS.
		const devProxy = HttpProxy.createProxyServer({
			target: "http://localhost:5174", //This address is fixed because we set it in mvite
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
