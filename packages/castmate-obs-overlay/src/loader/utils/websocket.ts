import { defineStore } from "pinia"
import { ComputedRef, MaybeRefOrGetter, computed, ref, toValue } from "vue"
import { RPCHandler, RPCMessage } from "castmate-ws-rpc"
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { createShallowBridge } from "castmate-satellite-ui-core"

export const useWebsocketBridge = defineStore("websocket-bridge", () => {
	let websocket: WebSocket | undefined = undefined

	const overlayId = ref(window.location.href.substring(window.location.href.lastIndexOf("/") + 1))

	const [bridge, receiver] = createShallowBridge(
		{
			name: "Unloaded Overlay",
			size: { width: 0, height: 0 },
			widgets: [],
		},
		(data: RPCMessage) => websocket?.send(JSON.stringify(data))
	)

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

			receiver(data)
		})
	}

	async function initialize() {
		connect()
	}

	return {
		overlayId: computed(() => overlayId.value),
		initialize,
		bridge,
	}
})
