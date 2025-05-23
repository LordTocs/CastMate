import { constructDefault, IPCViewerVariable, ViewerVariable } from "castmate-schema"
import { defineStore } from "pinia"
import { computed, MaybeRefOrGetter, onBeforeUnmount, onMounted, ref, toValue, watch } from "vue"
import {
	handleIpcMessage,
	ipcConvertSchema,
	ipcParseSchema,
	ProjectItem,
	useDockingStore,
	useIpcCaller,
	useProjectStore,
} from "../main"
import _cloneDeep from "lodash/cloneDeep"

function parseDefinition(def: IPCViewerVariable): ViewerVariable {
	return {
		name: def.name,
		schema: ipcParseSchema(def.schema),
	}
}

type ViewerData = Record<string, any>

interface SubscribedViewerData {
	refCount: number
	data: Record<string, any>
}

interface ViewerObserver {
	onNewViewerData(provider: string, id: string, viewer: ViewerData): any
	onViewerDataChanged(provider: string, id: string, varName: string, value: any): any
	onViewerDataRemoved(provider: string, id: string): any
	onNewViewerVariable(variable: ViewerVariable): any
	onViewerVariableDeleted(variable: string): any
}

export const useViewerDataStore = defineStore("viewer-data", () => {
	const variables = ref(new Map<string, ViewerVariable>())

	const dockingStore = useDockingStore()
	const projectStore = useProjectStore()

	const getVariables = useIpcCaller<() => IPCViewerVariable[]>("viewer-data", "getVariables")
	const setVariable = useIpcCaller<(provider: string, id: string, varname: string, value: any) => void>(
		"viewer-data",
		"setVariable"
	)
	const deleteVariable = useIpcCaller<(name: string) => any>("viewer-data", "deleteVariable")

	const queryPagedViewerData = useIpcCaller<
		(start: number, end: number, sortBy: string | undefined, sortOrder: number | undefined) => Record<string, any>[]
	>("viewer-data", "queryPagedData")

	const observers = new Array<ViewerObserver>()

	function observeViewers(observer: ViewerObserver) {
		observers.push(observer)
	}

	function unobserveViewers(observer: ViewerObserver) {
		const idx = observers.findIndex((o) => o == observer)
		if (idx < 0) return
		observers.splice(idx, 1)
	}

	async function initialize() {
		const vars = await getVariables()

		for (const column of vars) {
			variables.value.set(column.name, parseDefinition(column))
		}

		handleIpcMessage("viewer-data", "columnAdded", (event, ipcDef: IPCViewerVariable) => {
			const newDef = parseDefinition(ipcDef)

			variables.value.set(ipcDef.name, newDef)

			for (const o of observers) {
				o.onNewViewerVariable(newDef)
			}
		})

		handleIpcMessage("viewer-data", "columnRemoved", (event, name: string) => {
			variables.value.delete(name)

			for (const o of observers) {
				o.onViewerVariableDeleted(name)
			}
		})

		handleIpcMessage(
			"viewer-data",
			"viewerDataChanged",
			(event, provider: string, id: string, varName: string, value: any) => {
				for (const o of observers) {
					o.onViewerDataChanged(provider, id, varName, value)
				}
			}
		)

		handleIpcMessage(
			"viewer-data",
			"viewerDataAdded",
			(event, provider: string, id: string, data: Record<string, any>) => {
				for (const o of observers) {
					o.onNewViewerData(provider, id, data)
				}
			}
		)
	}

	async function queryViewersPaged(
		provider: string,
		start: number,
		end: number,
		sortBy: string | undefined,
		sortOrder: number | undefined
	) {
		return await queryPagedViewerData(start, end, sortBy, sortOrder)
	}

	const createViewerVariableIPC = useIpcCaller<(varDesc: IPCViewerVariable) => void>("viewer-data", "createVariable")

	async function createViewerVariable(variableDesc: ViewerVariable) {
		const ipcSchema = ipcConvertSchema(variableDesc.schema, "viewer-variable")

		await createViewerVariableIPC({
			name: variableDesc.name,
			schema: ipcSchema,
		})
	}

	async function editViewerVariable(id: string, desc: ViewerVariable) {}

	async function deleteViewerVariable(id: string) {
		deleteVariable(id)
	}

	async function setViewerVariable(id: string, varname: string, value: any) {
		await setVariable("twitch", id, varname, value)
	}

	return {
		initialize,
		variables: computed(() => variables.value),
		queryViewersPaged,
		observeViewers,
		unobserveViewers,
		createViewerVariable,
		editViewerVariable,
		deleteViewerVariable,
		setViewerVariable,
	}
})

function sortedIndex<T>(array: Array<T>, value: T, compare: (a: T, b: T) => number, min?: number, max?: number) {
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

function cloneSparse<T>(arr: Array<T>, lengthOverride?: number) {
	const result = new Array(lengthOverride ?? arr.length)
	arr.forEach((v, i) => (result[i] = v))
	return result
}

export function useLazyViewerQuery(
	sortField: MaybeRefOrGetter<string | undefined>,
	sortOrder: MaybeRefOrGetter<number | undefined>
) {
	const getNumRows = useIpcCaller<() => number>("viewer-data", "getNumRows")

	const provider = "twitch"
	const viewerDataStore = useViewerDataStore()

	const loadedViewers = ref(new Map<string, ViewerData>())
	const lazyViewers = ref(new Array<ViewerData>())

	const totalDataRows = ref(0)
	const loading = ref(false)

	const updateForcer = ref(0)

	const first = ref(0)
	const last = ref(0)

	const observer: ViewerObserver = {
		onNewViewerData(provider, id, viewer) {
			console.log("New Viewer", provider, id, viewer)
			const order = toValue(sortOrder)
			const field = toValue(sortField)

			let idx: number | undefined = undefined
			if (!order || !field) {
				//end append
				idx = lazyViewers.value.length + 1
			} else {
				const orderFactor = order < 0 ? -1 : 1
				idx = sortedIndex(
					lazyViewers.value,
					viewer,
					(a, b) => {
						if (a == null && b == null) {
							return 0
						}
						if (a == null) {
							return 1
						}
						if (b == null) {
							return -1
						}

						const aField = a[field]
						const bField = b[field]

						if (aField < bField) {
							return -1 * orderFactor
						} else if (aField > bField) {
							return 1 * orderFactor
						}
						return 0
					},
					first.value - 1,
					last.value + 1
				)
			}

			totalDataRows.value++

			if (idx < first.value || idx > last.value) {
				//Not in view!
				console.log("Out of view add!", idx, totalDataRows.value)
				//NOTE: The PrimeVue virtual scroller doesn't properly hook reactivity.
				//While we should just be able to set lazyViewers.value.length = totalDataRows.value
				//We can't because it won't trigger a lazy load. Instead we clone the array and preserve it's sparseness
				//SUB-NOTE: We can't use Array.from() to clone as it doesn't handle sparsity
				lazyViewers.value = cloneSparse(lazyViewers.value, totalDataRows.value)
			} else {
				console.log("In view add!", idx, totalDataRows.value)
				const slug = `${provider}-${id}`
				lazyViewers.value.splice(idx, 0, viewer)
				loadedViewers.value.set(slug, lazyViewers.value[idx])
			}
		},
		onViewerDataChanged(provider, id, varName, value) {
			console.log("changed", provider, id, varName, value)
			const existing = loadedViewers.value.get(`${provider}-${id}`)
			if (existing) {
				existing[varName] = value
			}
		},
		onViewerDataRemoved(provider, id) {
			console.log("removed", provider, id)
			const slug = `${provider}-${id}`
			const loaded = loadedViewers.value.has(slug)
			--totalDataRows.value
			if (loaded) {
				loadedViewers.value.delete(slug)
				for (let i = toValue(first); i < toValue(last); ++i) {
					if (lazyViewers.value[i][provider] == id) {
						lazyViewers.value.splice(i, 1)
						break
					}
				}
				loadRange(toValue(last), toValue(last))
			}
			lazyViewers.value.length = totalDataRows.value
		},
		async onNewViewerVariable(variable) {
			const defaultValue = await constructDefault(variable.schema)

			for (let i = first.value; i < last.value; ++i) {
				const viewer = lazyViewers.value[i]

				if (!viewer) continue

				viewer[variable.name] = _cloneDeep(defaultValue)
			}
		},
		onViewerVariableDeleted(variableName) {
			for (let i = first.value; i < last.value; ++i) {
				const viewer = lazyViewers.value[i]

				if (!viewer) continue

				delete viewer[variableName]
			}
		},
	}

	async function forceReload() {
		lazyViewers.value = new Array<ViewerData>(totalDataRows.value)
		await loadRange(first.value, last.value)
	}

	onMounted(async () => {
		viewerDataStore.observeViewers(observer)

		totalDataRows.value = await getNumRows()
		lazyViewers.value = new Array<ViewerData>(totalDataRows.value)
	})

	onBeforeUnmount(() => {
		unloadRange(toValue(first), toValue(last))
		viewerDataStore.unobserveViewers(observer)
	})

	watch(
		() => ({ sortField: toValue(sortField), sortOrder: toValue(sortOrder) }),
		() => {
			forceReload()
		}
	)

	async function updateRange(newFirst: number, newLast: number) {
		console.log("UpdateRange(", newFirst, ",", newLast, ") out of", totalDataRows.value)
		if (newLast < newFirst) {
			console.log("Range Error!", newLast, newFirst)
			return
		}

		const oldFirst = first.value
		const oldLast = last.value

		first.value = newFirst
		last.value = newLast

		const promises = new Array<Promise<void>>()

		if (newFirst < oldFirst) {
			//Load new range
			promises.push(loadRange(newFirst, oldFirst))
		} else if (newFirst > oldFirst) {
			//Unload old range
			unloadRange(oldFirst, newFirst)
		}

		if (newLast > oldLast) {
			//Load New Range
			promises.push(loadRange(oldLast, newLast))
		} else if (newLast < oldLast) {
			//Unload old range
			unloadRange(newLast, oldLast)
		}

		await Promise.all(promises)
	}

	function unloadRange(start: number, end: number) {
		for (let i = start; i < end; ++i) {
			if (i in lazyViewers.value) {
				const slug = `${provider}-${lazyViewers.value[i][provider]}`
				delete lazyViewers.value[i]
				loadedViewers.value.delete(slug)
			}
		}
	}

	async function loadRange(start: number, end: number) {
		if (start >= end) {
			console.log("loadRange bad range", start, end)
			return
		}

		console.log("Loading Viewer Range", start, "->", end)

		loading.value = true
		const viewers = await viewerDataStore.queryViewersPaged(
			provider,
			start,
			end,
			toValue(sortField),
			toValue(sortOrder)
		)
		for (let i = 0; i < viewers.length; ++i) {
			const inputViewer = viewers[i]
			const slug = `${provider}-${inputViewer[provider]}`

			const existing = loadedViewers.value.get(slug)
			if (existing) {
				Object.assign(existing, viewers[i])
				lazyViewers.value[start + i] = existing
			} else {
				loadedViewers.value.set(slug, inputViewer)
				const loaded = loadedViewers.value.get(slug)
				if (!loaded) throw new Error("How did this happen?")
				lazyViewers.value[start + i] = loaded
			}
		}
		loading.value = false
	}

	return {
		viewers: computed(() => {
			updateForcer.value
			return lazyViewers.value
		}),
		updateRange,
		loading: computed(() => loading.value),
	}
}
