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
import { DashboardConfig, DashboardWidget } from "castmate-plugin-dashboards-shared"
import { useCastMateBridge, useSatelliteWidgetBridge } from "castmate-satellite-ui-core"

export function handleDashboardRPC(id: string, func: (...args: any[]) => any) {
	const bridge = useSatelliteWidgetBridge()

	onMounted(() => {
		bridge.registerRPC(id, func)
	})

	onBeforeUnmount(() => {
		bridge.unregisterRPC(id)
	})
}

export function useCallDashboardRPC<T extends (...args: any) => any>(id: string) {
	const bridge = useCastMateBridge()

	return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
		const result = await bridge.callRPC(id, ...args)
		return result as ReturnType<T>
	}
}
