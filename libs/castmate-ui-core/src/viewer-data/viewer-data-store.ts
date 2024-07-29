import { IPCViewerVariable, ViewerVariable } from "castmate-schema"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { handleIpcMessage, ipcParseSchema, useIpcCaller } from "../main"

function parseDefinition(def: IPCViewerVariable): ViewerVariable {
	return {
		name: def.name,
		schema: ipcParseSchema(def.schema),
	}
}

export const useViewerDataStore = defineStore("viewer-data", () => {
	const variables = ref(new Map<string, ViewerVariable>())

	const getVariables = useIpcCaller<() => IPCViewerVariable[]>("viewer-data", "getVariables")

	const subscribeToViewerData = useIpcCaller<(provider: string, id: string) => Record<string, any>>(
		"viewer-data",
		"subscribeToViewerData"
	)
	const unsubscribeToViewerData = useIpcCaller<(provider: string, id: string) => any>(
		"viewer-data",
		"unsubscribeToViewerData"
	)

	const viewerData = ref(new Map<string, Record<string, any>>())

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
			(event, provider: string, id: string, data: Record<string, any>) => {
				viewerData.value.set(`${provider}-${id}`, data)
			}
		)
	}

	async function subscribeToViewer(provider: string, id: string) {
		const initialData = await subscribeToViewerData(provider, id)
		viewerData.value.set(`${provider}-${id}`, initialData)
	}

	async function unsubscribeToViewer(provider: string, id: string) {
		await unsubscribeToViewerData(provider, id)
		viewerData.value.delete(`${provider}-${id}`)
	}

	return {
		initialize,
		variables: computed(() => variables.value),
		subscribeToViewer,
		unsubscribeToViewer,
	}
})
