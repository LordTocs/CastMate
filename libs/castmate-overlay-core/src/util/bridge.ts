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
import { constructDefault, ViewerDataObserver, ViewerDataRow } from "castmate-schema"
import _cloneDeep from "lodash/cloneDeep"

export type BridgeViewerData = ComputedRef<ViewerDataRow[]>

export interface CastMateBridgeImplementation {
	acquireState(plugin: string, state: string): void
	releaseState(plugin: string, state: string): void
	state: { readonly value: Record<string, Record<string, any>> }
	config: { readonly value: OverlayWidgetConfig }
	registerRPC(id: string, func: (...args: any[]) => any): void
	unregisterRPC(id: string): void
	registerMessage(id: string, func: (...args: any[]) => any): void
	unregisterMessage(id: string, func: (...args: any[]) => any): void
	observeViewerData(observer: ViewerDataObserver): ViewerDataObserver
	unobserveViewerData(observer: ViewerDataObserver): void
	queryViewerData(
		start: number,
		end: number,
		sortBy: string | undefined,
		sortOrder: number | undefined
	): Promise<ViewerDataRow[]>
	callRPC(id: string, ...args: any[]): Promise<any>
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
		observeViewerData(observer) {
			return observer
		},
		unobserveViewerData(observer) {},
		async queryViewerData() {
			return []
		},
		async callRPC(id, ...args) {},
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

export function useCallOverlayRPC<T extends (...args: any) => any>(id: string) {
	const bridge = useCastMateBridge()

	return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
		const result = await bridge.callRPC(id, ...args)
		return result as ReturnType<T>
	}
}

interface ViewerTableRow {
	name: string
	id: string
	[varName: string]: any
}

function sortedIndex<T, V>(array: Array<T>, value: V, compare: (a: T, b: V) => number, min?: number, max?: number) {
	let low = min ?? 0
	let high = max ?? array.length

	while (low < high) {
		var mid = (low + high) >>> 1
		const comparison = compare(array[mid], value)
		if (comparison < 0) low = mid + 1
		else high = mid
	}
	return low
}

export function useViewerDataTable(
	provider: MaybeRefOrGetter<string>,
	variables: MaybeRefOrGetter<string[]>,
	sortBy: MaybeRefOrGetter<string>,
	sortOrder: MaybeRefOrGetter<number>,
	count: MaybeRefOrGetter<number>
) {
	const bridge = useCastMateBridge()

	const tableData = ref<ViewerDataRow[]>([])

	let observer: ViewerDataObserver | undefined = undefined

	onMounted(() => {
		watch(
			[
				() => toValue(provider),
				() => toValue(variables),
				() => toValue(sortBy),
				() => toValue(sortOrder),
				() => toValue(count),
			],
			([newProvider, newVariables, newSortBy, newSortOrder, newCount]) => {
				const oldObserver = observer
				const orderFactor = newSortOrder < 0 ? -1 : 1

				const loadTable = async () => {
					const data = await bridge.queryViewerData(0, newCount, newSortBy, newSortOrder)
					tableData.value = data
				}

				const initialQuery = loadTable()

				observer = bridge.observeViewerData({
					async onNewViewerData(provider, id, viewerData) {
						//TODO: Do Better
						await loadTable()
					},
					async onViewerDataChanged(provider, id, varName, value) {
						//TODO: Do Better
						await loadTable()
					},
					onViewerDataRemoved(provider, id) {
						//TODO, not implemented
					},
					onViewerVariableDeleted(variable) {
						for (const viewer of tableData.value) {
							viewer[variable]
						}
					},
					async onNewViewerVariable(variable) {
						const defaultValue = await constructDefault(variable.schema)
						for (const viewer of tableData.value) {
							viewer[variable.name] = _cloneDeep(defaultValue)
						}
					},
				})

				if (oldObserver) {
					//Unobserve after the new observe so we don't trigger a reobserve over websocket
					bridge.unobserveViewerData(oldObserver)
				}
			},
			{ immediate: true, deep: true }
		)
	})

	onBeforeUnmount(() => {
		if (observer) {
			bridge.unobserveViewerData(observer)
			observer = undefined
		}
	})

	return computed<ViewerTableRow[]>(() => {
		const providerId = toValue(provider)
		const variableNames = toValue(variables)

		return tableData.value.map((d) => {
			const result: ViewerTableRow = {
				name: d[`${providerId}_name`],
				id: d[providerId],
			}

			for (const varName of variableNames) {
				result[varName] = d[varName]
			}

			return result
		})
	})
}
