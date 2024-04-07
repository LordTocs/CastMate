import { defineStore } from "pinia"
import { ComputedRef, MaybeRefOrGetter, computed, ref, toValue } from "vue"
import { RPCHandler, RPCMessage } from "castmate-ws-rpc"
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { CastMateBridgeImplementation } from "castmate-overlay-core"

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
