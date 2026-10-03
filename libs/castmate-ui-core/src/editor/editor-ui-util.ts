import {
	EditorEventSpec,
	EditorFunctionSpec,
	MaybePromise,
	RawEditorEventSpec,
	RawEditorFunctionSpec,
	Schema,
	SchemaArgTypes,
	SchemaType,
} from "castmate-schema"
import { ipcRenderer, IpcRendererEvent } from "electron"
import { useIpcMessage } from "../main"
import { tryOnBeforeMount, tryOnUnmounted } from "@vueuse/core"
import { toRaw } from "vue"

type EditorEventHandler<TEditorEvent extends EditorEventSpec<Schema[]>> = (
	...args: SchemaArgTypes<TEditorEvent["schema"]>
) => Promise<void>

export function handleEditorEvent<TEditorEvent extends EditorEventSpec<Schema[]>>(
	spec: TEditorEvent,
	handler: EditorEventHandler<TEditorEvent>
) {
	const slug = `${spec.plugin}_${spec.id}`
	const handlerWrapper = async (event: IpcRendererEvent, ...args: SchemaArgTypes<TEditorEvent["schema"]>) => {
		try {
			//TODO: Deserialize Args
			await handler(...args)
		} catch (err) {
			console.error("Error Handling Editor Event", slug, err)
		}
	}
	tryOnBeforeMount(() => {
		ipcRenderer.on(slug, handlerWrapper)
	})

	tryOnUnmounted(() => {
		ipcRenderer.off(slug, handlerWrapper)
	})
}

export function handleRawEditorEvent<TFunc extends (...args: any[]) => void>(
	spec: RawEditorEventSpec<TFunc>,
	handler: (...args: Parameters<TFunc>) => MaybePromise<any>
) {
	const slug = `${spec.plugin}_${spec.id}`

	const handlerWrapper = async (event: IpcRendererEvent, ...args: Parameters<TFunc>) => {
		try {
			await handler(...args)
		} catch (err) {
			console.error("Error Handling Editor Event", slug, err)
		}
	}
	tryOnBeforeMount(() => {
		ipcRenderer.on(slug, handlerWrapper)
	})

	tryOnUnmounted(() => {
		ipcRenderer.off(slug, handlerWrapper)
	})
}

export function useEditorFunction<TFunc extends EditorFunctionSpec>(spec: TFunc) {
	const slug = `${spec.plugin}_${spec.id}`

	const invoker = async (...args: SchemaArgTypes<TFunc["schema"]["args"]>) => {
		//TODO serialize args

		const result = await ipcRenderer.invoke(slug, ...args)

		//TODO deserialize result

		return result as SchemaType<TFunc["schema"]["returns"]>
	}

	return invoker
}

export function useRawEditorFunction<TFunc extends (...args: any[]) => any>(spec: RawEditorFunctionSpec<TFunc>) {
	const slug = `${spec.plugin}_${spec.id}`

	const invoker = async (...args: Parameters<TFunc>) => {
		//Use toRaw to unwrap any reactive proxies as ipc doesn't like them
		const result = await ipcRenderer.invoke(slug, ...args.map(toRaw))

		return result as ReturnType<TFunc>
	}

	return invoker
}
