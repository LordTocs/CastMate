import { defineStore } from "pinia"
import { ComputedRef, MaybeRefOrGetter, computed, ref, toValue } from "vue"
import { RPCHandler, RPCMessage } from "castmate-ws-rpc"
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { CastMateBridgeImplementation, useOverlaySoundPlayer } from "castmate-overlay-core"
import { ViewerDataRow, ViewerDataObserver, IPCSchema } from "castmate-schema"
import { ipcParseSchema } from "castmate-core"

export const useWebsocketBridge = defineStore("websocket-bridge", () => {
	let websocket: WebSocket | undefined = undefined
	const rpcs = new RPCHandler()

	const config = ref<OverlayConfig>({
		name: "UNLOADED PLUGIN",
		size: { width: 0, height: 0 },
		widgets: [],
	})

	const stateStore = ref<Record<string, Record<string, any>>>({})
	const stateMeta: Record<string, Record<string, { refCount: number }>> = {}

	const widgetRpcs: Record<string, (...args: any) => any> = {}
	const widgetBroadcastHandlers: Record<string, ((...args: any) => any)[]> = {}

	const viewerDataObservers = new Set<ViewerDataObserver>()

	const overlayId = ref(window.location.href.substring(window.location.href.lastIndexOf("/") + 1))

	const sender = (data: RPCMessage) => websocket?.send(JSON.stringify(data))

	function connect() {
		console.log("Connecting To ", `ws://${window.location.host}?overlay=${overlayId.value}`)
		websocket = new WebSocket(`ws://${window.location.host}?overlay=${overlayId.value}`)

		websocket.addEventListener("error", (err) => {
			console.error("WebSocket Error:", err)
		})

		websocket.addEventListener("close", () => {
			setTimeout(() => {
				console.log("Connection Closed: Attempting Reconnect")
				websocket = undefined
				connect()
			}, 1000)
		})

		websocket.addEventListener("message", (ev) => {
			let data: RPCMessage | undefined = undefined
			if (typeof ev.data != "string") return

			try {
				data = JSON.parse(ev.data)
			} catch {
				return
			}

			rpcs.handleMessage(data as RPCMessage, sender)
		})
	}

	rpcs.handle("overlays_setConfig", (configData: OverlayConfig) => {
		console.log("Config Set", configData)
		config.value = configData
		document.title = `CastMate Overlay -- ${configData.name}`
	})

	rpcs.handle("overlays_widgetRPC", (widgetId: string, rpcId: string, ...args: any[]) => {
		const widgetRpc = widgetRpcs[`${widgetId}.${rpcId}`]

		if (widgetRpc) return widgetRpc(...args)

		return undefined
	})

	rpcs.handle("overlays_broadcast", (broadcastId: string, ...args: any[]) => {
		const handlers = widgetBroadcastHandlers[`${broadcastId}`]
		if (!handlers) return

		for (const handler of handlers) {
			try {
				handler(...args)
			} catch (err) {
				console.error(err)
			}
		}
	})

	//VIEWER DATA EVENTS
	rpcs.handle("overlays_onNewViewerData", (provider: string, id: string, viewerData: ViewerDataRow) => {
		for (const observer of viewerDataObservers.values()) {
			observer.onNewViewerData(provider, id, viewerData)
		}
	})

	rpcs.handle("overlays_onViewerDataChanged", (provider: string, id: string, varName: string, value: any) => {
		for (const observer of viewerDataObservers.values()) {
			observer.onViewerDataChanged(provider, id, varName, value)
		}
	})

	rpcs.handle("overlays_onViewerDataRemoved", (provider: string, id: string) => {
		for (const observer of viewerDataObservers.values()) {
			observer.onViewerDataRemoved(provider, id)
		}
	})

	rpcs.handle("overlays_onNewViewerVariable", (varName: string, ipcSchema: IPCSchema) => {
		const schema = ipcParseSchema(ipcSchema)
		for (const observer of viewerDataObservers.values()) {
			observer.onNewViewerVariable({ name: varName, schema })
		}
	})

	rpcs.handle("overlays_onViewerVariableDeleted", (varName: string) => {
		for (const observer of viewerDataObservers.values()) {
			observer.onViewerVariableDeleted(varName)
		}
	})

	const soundPlayer = useOverlaySoundPlayer()

	rpcs.handle(
		"overlays_playAudio",
		(mediaFile: string, playId: string, startSec: number, endSec: number, volume: number) => {
			const url = `http://${window.location.host}/${mediaFile.startsWith("/") ? mediaFile.slice(1) : mediaFile}`

			soundPlayer.playSound(playId, url, startSec, endSec, volume)
		}
	)

	rpcs.handle("overlays_cancelAudio", (playId: string) => {
		soundPlayer.cancelSound(playId)
	})

	function acquireState(plugin: string, state: string) {
		const meta = stateMeta[plugin]?.[state]
		if (!meta) {
			//New state
			if (!(plugin in stateStore.value)) {
				stateStore.value[plugin] = {}
			}

			stateStore.value[plugin][state] = undefined

			if (!(plugin in stateMeta)) {
				stateMeta[plugin] = {}
			}

			stateMeta[plugin][state] = { refCount: 1 }

			rpcs.call("overlays_acquireState", sender, plugin, state)
		} else {
			meta.refCount += 1
		}
	}

	function releaseState(plugin: string, state: string) {
		const meta = stateMeta[plugin]?.[state]

		if (!meta) {
			console.error("Tried to release non acquired state", plugin, state)
			return
		}

		meta.refCount -= 1

		if (meta.refCount == 0) {
			rpcs.call("overlays_freeState", sender, plugin, state)

			delete stateMeta[plugin][state]
			delete stateStore.value[plugin][state]
		}
	}

	function getBridge(widget: MaybeRefOrGetter<string>): CastMateBridgeImplementation {
		return {
			acquireState,
			releaseState,
			state: stateStore,
			config: computed(() => {
				const widgetConfig = config.value.widgets.find((w) => w.id == toValue(widget))
				if (widgetConfig) return widgetConfig

				return {
					id: "error",
					plugin: "error",
					widget: "error",
					name: "error",
					size: { width: 0, height: 0 },
					position: { x: 0, y: 0 },
					config: {},
					visible: false,
					locked: false,
				}
			}),
			registerRPC(id, func) {
				widgetRpcs[`${toValue(widget)}.${id}`] = func
			},
			unregisterRPC(id) {
				delete widgetRpcs[`${toValue(widget)}.${id}`]
			},
			registerMessage(id, func) {
				const slug = `${id}`
				if (slug in widgetBroadcastHandlers) {
					widgetBroadcastHandlers[slug].push(func)
				} else {
					widgetBroadcastHandlers[slug] = [func]
				}
			},
			unregisterMessage(id, func) {
				const handlers = widgetBroadcastHandlers[id]
				if (!handlers) return

				const idx = handlers.findIndex((h) => h == func)
				if (idx < 0) return

				handlers.splice(idx, 1)

				if (handlers.length == 0) {
					delete widgetBroadcastHandlers[id]
				}
			},
			async callRPC(id, ...args) {
				return await rpcs.call("overlays_widgetRPC", sender, id, toValue(widget), ...args)
			},
			observeViewerData(observer) {
				if (viewerDataObservers.has(observer)) return observer

				const listening = viewerDataObservers.size != 0
				viewerDataObservers.add(observer)

				if (!listening) {
					rpcs.call("overlays_observeViewerData", sender)
				}

				return observer
			},
			async unobserveViewerData(observer) {
				if (!viewerDataObservers.has(observer)) return

				viewerDataObservers.delete(observer)

				const stillListening = viewerDataObservers.size != 0

				if (!stillListening) {
					await rpcs.call("overlays_unobserveViewerData", sender)
				}
			},
			async queryViewerData(start, end, sortBy, sortOrder) {
				return (await rpcs.call(
					"overlays_queryViewerData",
					sender,
					start,
					end,
					sortBy,
					sortOrder
				)) as ViewerDataRow[]
			},
		}
	}

	async function initialize() {
		connect()
	}

	return {
		overlayId: computed(() => overlayId.value),
		config: computed(() => config.value),
		initialize,
		getBridge,
	}
})
