import { IPCViewerVariable, ViewerVariable } from "castmate-schema"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { handleIpcMessage, ipcParseSchema, ProjectItem, useDockingStore, useIpcCaller, useProjectStore } from "../main"
import ViewerDataPage from "../components/viewer-data/ViewerDataPage.vue"

function parseDefinition(def: IPCViewerVariable): ViewerVariable {
	return {
		name: def.name,
		schema: ipcParseSchema(def.schema),
	}
}

interface SubscribedViewerData {
	refCount: number
	data: Record<string, any>
}

export const useViewerDataStore = defineStore("viewer-data", () => {
	const variables = ref(new Map<string, ViewerVariable>())

	const dockingStore = useDockingStore()
	const projectStore = useProjectStore()

	const getVariables = useIpcCaller<() => IPCViewerVariable[]>("viewer-data", "getVariables")

	const queryPagedViewerData = useIpcCaller<
		(start: number, end: number, sortBy: string | undefined, sortOrder: number | undefined) => Record<string, any>[]
	>("viewer-data", "queryPagedData")

	const viewerData = ref(new Map<string, SubscribedViewerData>())

	async function initialize() {
		const vars = await getVariables()

		for (const column of vars) {
			variables.value.set(column.name, parseDefinition(column))
		}

		handleIpcMessage("viewer-data", "columnAdded", (event, ipcDef: IPCViewerVariable) => {
			variables.value.set(ipcDef.name, parseDefinition(ipcDef))
		})

		handleIpcMessage("viewer-data", "columnRemoved", (event, name: string) => {
			variables.value.delete(name)
		})

		handleIpcMessage(
			"viewer-data",
			"viewerDataChanged",
			(event, provider: string, id: string, varName: string, value: any) => {
				const slug = `${provider}-${id}`
				const existing = viewerData.value.get(slug)
				if (existing) {
					existing.data[varName] = value
				}
			}
		)

		const projectItem = computed<ProjectItem>(() => {
			return {
				id: "viewer-data",
				title: "Viewer Data",
				icon: "mdi mdi-table-account",
				open() {
					dockingStore.openPage("viewer-data", "Viewer Data", ViewerDataPage)
				},
			}
		})

		projectStore.registerProjectGroupItem(projectItem)
	}

	function subscribeToViewer(provider: string, id: string, initialData: Record<string, any>) {
		const slug = `${provider}-${id}`
		const existing = viewerData.value.get(slug)
		if (existing) {
			Object.assign(existing.data, initialData)
			existing.refCount++
			return existing.data
		} else {
			viewerData.value.set(slug, { refCount: 1, data: initialData })
			return initialData
		}
	}

	async function unsubscribeToViewer(provider: string, id: string) {
		const slug = `${provider}-${id}`
		const existing = viewerData.value.get(slug)
		if (existing) {
			const remaining = --existing.refCount
			if (remaining <= 0) {
				viewerData.value.delete(slug)
			}
		}
	}

	async function queryViewersPaged(
		provider: string,
		start: number,
		end: number,
		sortBy: string | undefined,
		sortOrder: number | undefined
	) {
		const data = await queryPagedViewerData(start, end, sortBy, sortOrder)

		for (let i = 0; i < data.length; ++i) {
			const viewerData = data[i]
			data[i] = subscribeToViewer(provider, viewerData[provider], viewerData)
		}

		return data
	}

	return {
		initialize,
		variables: computed(() => variables.value),
		queryViewersPaged,
		unsubscribeToViewer,
	}
})
