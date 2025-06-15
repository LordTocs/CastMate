import { CastMateShallowBridgeBase } from "castmate-satellite-ui-core"
import { useFullState } from "../main"
import { inject, markRaw, provide, reactive, Ref, UnwrapRef } from "vue"
import { RPCHandler, RPCReceiver, RPCSender } from "castmate-ws-rpc"
import { provideLocal } from "@vueuse/core"

/**
 * Creates a satellite shallow bridge that runs entirely in this renderer process
 * Also disables RPCs and Messages (Intended for editor use)
 */
export function createEditorSatelliteShallowBridge<ConfigType = Object>(
	config: Ref<ConfigType>
): CastMateShallowBridgeBase<UnwrapRef<ConfigType>> {
	const state = useFullState()

	//@ts-ignore
	const bridge = reactive({
		acquireState(plugin, state) {},
		releaseState(plugin, state) {},
		//@ts-ignore
		state,
		//@ts-ignore
		config,
		registerRPC(widgetId, id, func) {},
		unregisterRPC(widgetId, id) {},
		registerMessage(id, func) {},
		unregisterMessage(id, func) {},
		async callRPC(id, ...args) {},
	} as CastMateShallowBridgeBase<ConfigType>)

	return bridge
}

export function provideEditorSatelliteShallowBridge<ConfigType = Object>(config: Ref<ConfigType>) {
	const bridge = createEditorSatelliteShallowBridge(config)
	provide("castmate-bridge", bridge)
	provide("isEditor", true)
}

export function useIsEditor() {
	return inject<boolean>("isEditor", false)
}

interface LocalCastMateShallowBridge<ConfigType = Object> extends CastMateShallowBridgeBase<ConfigType> {
	widgetRpcs: Record<string, (...args: any[]) => any>
	widgetBroadcasts: Record<string, Array<(...args: any[]) => any>>
}

/**
 * Creates a satellite shallow bridge that runs entirely in this renderer process
 */
export function createLocalSatelliteShallowBridge<ConfigType = Object>(
	config: Ref<ConfigType>,
	sender: RPCSender
): [CastMateShallowBridgeBase<UnwrapRef<ConfigType>>, RPCReceiver] {
	const state = useFullState()

	const rpcs = markRaw(new RPCHandler())

	const bridge = reactive({
		acquireState(plugin, state) {},
		releaseState(plugin, state) {},
		//@ts-ignore
		state,
		//@ts-ignore
		config,
		widgetRpcs: {},
		widgetBroadcasts: {},
		registerRPC(widgetId, id, func) {
			const slug = `${widgetId}.${id}`
			if (slug in this.widgetRpcs) throw new Error("Double RPC Register")

			bridge.widgetRpcs[slug] = markRaw(func)
		},
		unregisterMessage(id: string, func: (...args: any[]) => any) {
			if (bridge.widgetBroadcasts[id]) {
				const idx = bridge.widgetBroadcasts[id].findIndex((f) => f === func)
				if (idx >= 0) {
					bridge.widgetBroadcasts[id].splice(idx, 1)
				}
			}
		},
	}) as LocalCastMateShallowBridge<UnwrapRef<ConfigType>>

	rpcs.handle("satellite_setConfig", (configData: UnwrapRef<ConfigType>) => {
		bridge.config = configData
	})

	rpcs.handle("satellite_widgetRPC", async (widgetId: string, rpcId: string, ...args: any[]) => {
		return await bridge.widgetRpcs[`${widgetId}.${rpcId}`]?.(...args)
	})

	rpcs.handle("satellite_widgetBroadcast", async (broadcastId: string, args: any[]) => {
		if (broadcastId in bridge.widgetBroadcasts) {
			await Promise.allSettled(bridge.widgetBroadcasts[broadcastId].map((cbfn) => cbfn(...args)))
		}
	})

	return [
		bridge,
		async (data) => {
			await rpcs.handleMessage(data, sender)
			return true
		},
	]
}
