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
		})),
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
