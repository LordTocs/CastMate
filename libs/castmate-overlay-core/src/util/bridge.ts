import EventEmitter from "events"
import { WebSocket } from "ws"
import { defineStore } from "pinia"
import {
	ComputedRef,
	MaybeRefOrGetter,
	computed,
	inject,
	onBeforeUnmount,
	onMounted,
	ref,
	toValue,
	watch,
	watchEffect,
} from "vue"
import { OverlayConfig, OverlayWidgetConfig } from "castmate-plugin-overlays-shared"

export interface CastMateBridgeImplementation {
	acquireState<T>(plugin: string, state: string): void
	releaseState(plugin: string, state: string): void
	state: { readonly value: Record<string, Record<string, any>> }
	config: { readonly value: OverlayWidgetConfig }
	registerRPC(id: string, func: (...args: any[]) => any): void
	unregisterRPC(id: string): void
	registerMessage(id: string, func: (...args: any[]) => any): void
	unregisterMessage(id: string, func: (...args: any[]) => any): void
}

export function useCastMateBridge(): CastMateBridgeImplementation {
	return inject<CastMateBridgeImplementation>("castmate-bridge", {
		acquireState(plugin, state) {},
		releaseState(plugin, state) {},
		state: { value: {} },
		config: computed<OverlayWidgetConfig>(() => ({
			id: "error",
			plugin: "error",
			widget: "error",
			name: "error",
			size: { width: 0, height: 0 },
			position: { x: 0, y: 0 },
			config: {},
			visible: false,
			locked: false,
		})),
		registerRPC(id, func) {},
		unregisterRPC(id) {},
		registerMessage(id, func) {},
		unregisterMessage(id) {},
	})
}

export function useCastMateState<T = any>(
	plugin: MaybeRefOrGetter<string>,
	state: MaybeRefOrGetter<string>
): ComputedRef<T> {
	const bridge = useCastMateBridge()

	onMounted(() => {
		//Acquire
		watch(
			() => ({
				p: toValue(plugin),
				s: toValue(state),
			}),
			(newConfig, oldConfig) => {
				if (oldConfig) {
					bridge.releaseState(oldConfig.p, oldConfig.s)
				}

				bridge.acquireState(newConfig.p, newConfig.s)
			},
			{ immediate: true, deep: true }
		)
	})

	onBeforeUnmount(() => {
		bridge.releaseState(toValue(plugin), toValue(state))
	})

	return computed<T>(() => {
		return bridge.state.value[toValue(plugin)]?.[toValue(state)] as T
	})
}

export function handleOverlayMessage(id: string, func: (...args: any[]) => any) {
	const bridge = useCastMateBridge()

	onMounted(() => {
		bridge.registerMessage(id, func)
	})

	onBeforeUnmount(() => {
		bridge.unregisterMessage(id, func)
	})
}

export function handleOverlayRPC(id: string, func: (...args: any[]) => any) {
	const bridge = useCastMateBridge()

	onMounted(() => {
		bridge.registerRPC(id, func)
	})

	onBeforeUnmount(() => {
		bridge.unregisterRPC(id)
	})
}
