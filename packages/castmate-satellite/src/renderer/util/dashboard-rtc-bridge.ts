import { DashboardConfig } from "castmate-plugin-dashboards-shared"
import { usePrimarySatelliteConnection } from "castmate-ui-core"
import { defineStore } from "pinia"
import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue"

import { RPCHandler, RPCMessage } from "castmate-ws-rpc"
import { CastMateBridgeImplementation } from "castmate-dashboard-core"

export const useDashboardRTCBridge = defineStore("dashboard-rtc-bridge", () => {
	const connection = usePrimarySatelliteConnection()

	const config = ref<DashboardConfig>({
		name: "Loading Dashboard",
		remoteTwitchIds: [],
		pages: [],
	})

	const stateStore = ref<Record<string, Record<string, any>>>({})
	const stateMeta: Record<string, Record<string, { refCount: number }>> = {}

	const widgetRpcs: Record<string, (...args: any) => any> = {}
	const widgetBroadcastHandlers: Record<string, ((...args: any) => any)[]> = {}

	const rpcs = new RPCHandler()

	const sender = (data: RPCMessage) => connection.value?.controlChannel?.send(JSON.stringify(data))

	watch(
		connection,
		(value, oldValue) => {
			console.log("WHY NO CALLBACK???")
			if (!value) return

			if (connection.value?.state != "connected") return

			console.log("REGISTER DASHBOARD RTC HOOK")

			if (!connection.value?.controlChannel) {
				console.log("MISSING CONTROL CHANNEL!")
				return
			}

			connection.value.controlChannel.onmessage = (ev) => {
				try {
					const data = JSON.parse(ev.data)

					rpcs.handleMessage(data as RPCMessage, sender)
				} catch (err) {}
			}
		},
		{ deep: true, immediate: true }
	)

	rpcs.handle("dashboard_setConfig", (configData: DashboardConfig) => {
		console.log("Dashboard Config Set", configData)
		config.value = configData
	})

	rpcs.handle("dashboard_widgetRPC", (widgetId: string, rpcId: string, ...args: any[]) => {
		const widgetRpc = widgetRpcs[`${widgetId}.${rpcId}`]

		if (widgetRpc) return widgetRpc(...args)

		return undefined
	})

	rpcs.handle("dashboard_broadcast", (broadcastId: string, ...args: any[]) => {
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

			rpcs.call("dashboard_acquireState", sender, plugin, state)
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
			rpcs.call("dashboard_freeState", sender, plugin, state)

			delete stateMeta[plugin][state]
			delete stateStore.value[plugin][state]
		}
	}

	function getBridge(
		pageId: MaybeRefOrGetter<string>,
		sectionId: MaybeRefOrGetter<string>,
		widgetId: MaybeRefOrGetter<string>
	): CastMateBridgeImplementation {
		return {
			acquireState,
			releaseState,
			state: stateStore,
			config: computed(() => {
				const page = config.value.pages.find((p) => p.id == toValue(pageId))
				const section = page?.sections?.find((s) => s.id == toValue(sectionId))
				const widget = section?.widgets.find((w) => w.id == toValue(widgetId))

				const widgetConfig = widget
				if (widgetConfig) return widgetConfig

				return {
					id: "error",
					plugin: "error",
					widget: "error",
					name: "error",
					size: { width: 0, height: 0 },
					config: {},
				}
			}),
			registerRPC(id, func) {
				widgetRpcs[`${toValue(widgetId)}.${id}`] = func
			},
			unregisterRPC(id) {
				delete widgetRpcs[`${toValue(widgetId)}.${id}`]
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
				return await rpcs.call("dashboard_widgetRPC", sender, id, toValue(widgetId), ...args)
			},
		}
	}

	return {
		config: computed(() => config.value),
		getBridge,
	}
})
