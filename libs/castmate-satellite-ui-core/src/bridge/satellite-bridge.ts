import {
	computed,
	ComputedRef,
	inject,
	markRaw,
	MaybeRefOrGetter,
	onBeforeMount,
	onBeforeUnmount,
	onMounted,
	reactive,
	toValue,
	UnwrapRef,
	watch,
	unref,
	Raw,
	ref,
	Ref,
	provide,
} from "vue"

import { RPCHandler, RPCReceiver, RPCSender } from "castmate-ws-rpc"
import {
	RemoteSchemaType,
	RemoteTemplateResolutionContext,
	ResolvedSchemaType,
	resolveRemoteTemplateSchema,
	Schema,
} from "castmate-schema"

export interface CastMateShallowBridgeBase<ConfigType = Object> {
	acquireState(plugin: string, state: string): void
	releaseState(plugin: string, state: string): void
	readonly state: Record<string, Record<string, any>>
	config: ConfigType
	registerRPC(widgetId: string, id: string, func: (...args: any[]) => any): void
	unregisterRPC(widgetId: string, id: string): void
	registerMessage(id: string, func: (...args: any[]) => any): void
	unregisterMessage(id: string, func: (...args: any[]) => any): void
	callRPC(id: string, ...args: any[]): Promise<any>
}

interface CastMateShallowBridge<ConfigType = Object> extends CastMateShallowBridgeBase<ConfigType> {
	stateRefs: Record<string, Record<string, number>>
	rpcs: Raw<RPCHandler>
	widgetRpcs: Record<string, (...args: any[]) => any>
	widgetBroadcasts: Record<string, Array<(...args: any[]) => any>>
}

export function createShallowBridge<ConfigType = Object>(
	defaultConfig: ConfigType,
	sender: RPCSender
): [CastMateShallowBridgeBase<UnwrapRef<ConfigType>>, RPCReceiver] {
	const bridge = reactive({
		state: {},
		stateRefs: {},
		acquireState: markRaw((plugin, state) => {
			if (!(plugin in bridge.state)) {
				bridge.state[plugin] = {}
				bridge.stateRefs[plugin] = {}
			}

			if (state in bridge.state[plugin]) {
				bridge.stateRefs[plugin][state] += 1
			} else {
				bridge.stateRefs[plugin][state] = 1
				bridge.state[plugin][state] = undefined

				bridge.rpcs.call("satellite_acquireState", sender, plugin, state)
			}
		}),
		releaseState: markRaw((plugin, state) => {
			if (plugin in bridge.state) {
				if (state in bridge.state[plugin]) {
					if (bridge.stateRefs[plugin][state] == 1) {
						delete bridge.state[plugin][state]
						delete bridge.stateRefs[plugin][state]

						bridge.rpcs.call("satellite_releaseState", sender, plugin, state)
					} else {
						bridge.stateRefs[plugin][state] -= 1
					}
				}
			}
		}),
		config: ref(defaultConfig),
		rpcs: markRaw(new RPCHandler()),
		widgetRpcs: {},
		registerRPC(widgetId: string, id: string, func: (...args: any[]) => any) {
			const slug = `${widgetId}.${id}`
			if (slug in this.widgetRpcs) throw new Error("Double RPC Register")

			bridge.widgetRpcs[slug] = markRaw(func)
		},
		unregisterRPC(widgetId: string, id: string) {
			const slug = `${widgetId}.${id}`
			delete bridge.widgetRpcs[slug]
		},
		widgetBroadcasts: {},
		registerMessage(id: string, func: (...args: any[]) => any) {
			if (!(id in bridge.widgetBroadcasts)) {
				bridge.widgetBroadcasts[id] = []
			}

			bridge.widgetBroadcasts[id].push(func)
		},
		unregisterMessage(id: string, func: (...args: any[]) => any) {
			if (bridge.widgetBroadcasts[id]) {
				const idx = bridge.widgetBroadcasts[id].findIndex((f) => f === func)
				if (idx >= 0) {
					bridge.widgetBroadcasts[id].splice(idx, 1)
				}
			}
		},
		async callRPC(id, ...args) {
			return await bridge.rpcs.call(id, sender, ...args)
		},
	} as CastMateShallowBridge<ConfigType>)

	bridge.rpcs.handle("satellite_setConfig", (configData: UnwrapRef<ConfigType>) => {
		bridge.config = configData
	})

	bridge.rpcs.handle("satellite_widgetRPC", async (widgetId: string, rpcId: string, ...args: any[]) => {
		return await bridge.widgetRpcs[`${widgetId}.${rpcId}`]?.(...args)
	})

	bridge.rpcs.handle("satellite_widgetBroadcast", async (broadcastId: string, args: any[]) => {
		if (broadcastId in bridge.widgetBroadcasts) {
			await Promise.allSettled(bridge.widgetBroadcasts[broadcastId].map((cbfn) => cbfn(...args)))
		}
	})

	const receiver: RPCReceiver = async (data: unknown) => {
		await bridge.rpcs.handleMessage(data, sender)
		return true
	}

	return [bridge, receiver]
}

function createDummyBridge(): CastMateShallowBridgeBase {
	return {
		acquireState(plugin, state) {
			throw new Error("Dummy Bridge Accessed")
		},
		releaseState(plugin, state) {
			throw new Error("Dummy Bridge Accessed")
		},
		state: {},
		config: {},
		registerRPC(widgetId: string, id: string, func: (...args: any[]) => any) {
			throw new Error("Dummy Bridge Accessed")
		},
		unregisterRPC(widgetId: string, id: string) {
			throw new Error("Dummy Bridge Accessed")
		},
		registerMessage(id, func) {
			throw new Error("Dummy Bridge Accessed")
		},
		unregisterMessage(id, func) {
			throw new Error("Dummy Bridge Accessed")
		},
		callRPC(id, ...args) {
			throw new Error("Dummy Bridge Accessed")
		},
	}
}

export function useCastMateBridge() {
	return inject<CastMateShallowBridgeBase>("castmate-bridge", createDummyBridge())
}

export function useCastMateState<T = any>(
	plugin: MaybeRefOrGetter<string>,
	state: MaybeRefOrGetter<string>
): ComputedRef<T> {
	const bridge = useCastMateBridge()

	onBeforeMount(() => {
		watch(
			[() => toValue(plugin), () => toValue(state)],
			([plugin, state], [oldPlugin, oldState]) => {
				if (oldPlugin && oldState) {
					bridge.releaseState(oldPlugin, oldState)
				}

				bridge.acquireState(plugin, state)
			},
			{ immediate: true, deep: true }
		)
	})

	onBeforeUnmount(() => {
		bridge.releaseState(toValue(plugin), toValue(state))
	})

	return computed<T>(() => {
		return bridge.state[toValue(plugin)]?.[toValue(state)] as T
	})
}

interface VueResolutionContext extends RemoteTemplateResolutionContext {
	evalCounter: Ref<number>
	nextEval: number
	timer?: NodeJS.Timeout
}

export interface SatelliteWidgetBridge {
	readonly widgetId: string
	registerRPC(id: string, func: (...args: any[]) => any): void
	unregisterRPC(id: string): void
	callRPC(id: string, ...args: any[]): any
}

export function provideSatelliteWidgetBridge(widgetId: MaybeRefOrGetter<string>) {
	const bridge = useCastMateBridge()

	const widgetBridge: SatelliteWidgetBridge = {
		get widgetId() {
			return toValue(widgetId)
		},
		registerRPC(id, func) {
			bridge.registerRPC(toValue(widgetId), id, func)
		},
		unregisterRPC(id) {
			bridge.unregisterRPC(toValue(widgetId), id)
		},
		callRPC(id, ...args) {
			return bridge.callRPC(id, ...args)
		},
	}

	provide("castmate-widget-bridge", widgetBridge)
}

export function useSatelliteWidgetBridge() {
	return inject<SatelliteWidgetBridge>("castmate-widget-bridge", {
		get widgetId(): string {
			throw new Error("Accessed Dummy Bridge")
		},
		registerRPC(id, func) {
			throw new Error("Accessed Dummy Bridge")
		},
		unregisterRPC(id) {
			throw new Error("Accessed Dummy Bridge")
		},
		callRPC(id, ...args) {
			throw new Error("Accessed Dummy Bridge")
		},
	})
}

export function useResolvedSchema<TSchema extends Schema>(
	config: MaybeRefOrGetter<object | undefined>,
	schema: MaybeRefOrGetter<TSchema | undefined>
): ComputedRef<ResolvedSchemaType<TSchema> | undefined> {
	const context: VueResolutionContext = {
		evalCounter: ref(0),
		nextEval: Number.POSITIVE_INFINITY,
		scheduleReEval(seconds: number) {
			const now = Date.now()
			const evalTime = now + seconds * 1000

			if (evalTime < this.nextEval) {
				if (this.timer) {
					clearTimeout(this.timer)
				}
				this.nextEval = evalTime

				this.timer = setTimeout(() => {
					this.timer = undefined
					this.nextEval = Number.POSITIVE_INFINITY
					this.evalCounter.value++
				}, evalTime - now)
			}
		},
	}

	return computed(() => {
		const remoteConfig = toValue(config)

		if (remoteConfig == undefined) return undefined

		const schemaValue = toValue(schema)

		if (!schemaValue) return undefined

		context.evalCounter.value

		//Todo: Validate??
		return resolveRemoteTemplateSchema(remoteConfig as RemoteSchemaType<TSchema>, schemaValue, context)
	})
}
