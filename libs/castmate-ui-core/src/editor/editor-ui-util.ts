import {
	applyDataDiff,
	applyInvDataDiff,
	computeDataDiff,
	computeSubDataDiff,
	createDataEditor,
	createEmptyEditStack,
	DataEditor,
	EditorEventSpec,
	EditorFunctionSpec,
	getInvDataDiffPath,
	joinDataPath,
	MaybePromise,
	parseDataPath,
	RawEditorEventSpec,
	RawEditorFunctionSpec,
	Schema,
	SchemaArgTypes,
	SchemaType,
} from "castmate-schema"
import { ipcRenderer, IpcRendererEvent } from "electron"
import { focusDataByPath, RootDataBinding, useBaseDataBinding, useDataPath, useIpcMessage } from "../main"
import { injectLocal, provideLocal, tryOnBeforeMount, tryOnUnmounted, useEventListener } from "@vueuse/core"
import { computed, ComputedRef, inject, MaybeRefOrGetter, nextTick, onMounted, Ref, ref, toRaw, toValue } from "vue"
import _cloneDeep from "lodash/cloneDeep"

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

export function provideRootData(data: Ref<any>) {
	provideLocal("root-data", data)
}

export function useRootData<T = any>() {
	const result = injectLocal<Ref<T>>("root-data")
	if (!result) {
		throw new Error("RootData Not Supplied")
	}
	return result
}

export function provideDataEditor() {
	const editor = ref(createDataEditor())
	provideLocal<ComputedRef<DataEditor>>(
		"data-editor",
		computed(() => editor.value)
	)
	return editor
}

export function useDataEditor() {
	return injectLocal<ComputedRef<DataEditor>>(
		"data-editor",
		computed(() => createDataEditor())
	)
}

export function getViewDataByPath(editor: DataEditor, path: string) {
	const pathParsed = parseDataPath(path)

	let base = editor.view
	for (const trace of pathParsed) {
		if (base == null) return undefined

		base = base.subPaths[trace]
	}
	return base
}

export function useLocalViewData() {
	const editor = useDataEditor()
	const path = useDataPath()

	return computed(() => getViewDataByPath(editor.value, path.value))
}

export function useLocalDataEditUser() {
	const editor = useDataEditor()

	return computed(() => {
		const local = editor.value.editingUsers.get("local")
		if (!local) throw new Error("LOCAL USER")
		return local
	})
}

export function viewRef<T>(id: string): Ref<T | undefined>
export function viewRef<T = any>(id: string, value: T): Ref<T>
export function viewRef(id: string, value?: any) {
	const viewData = useLocalViewData()

	const backup = ref(value)

	onMounted(() => {
		if (!viewData.value) return
		if (id in viewData.value.data) return

		viewData.value.data[id] = value
	})

	return computed({
		get() {
			if (!viewData.value?.data) return backup.value
			if (id in viewData.value.data) return viewData.value.data[id]
			return backup.value
		},
		set(v) {
			if (viewData.value) {
				viewData.value.data[id] = v
			} else {
				backup.value = v
			}
		},
	})
}

export async function undoEditorAction(editor: DataEditor, rootBinding: RootDataBinding, rootData: Ref<any>) {
	const top = editor.editStack.undoStack.pop()

	if (!top) return

	const invPath = getInvDataDiffPath(top)

	console.log("From", rootData.value, getInvDataDiffPath(top))
	applyInvDataDiff(rootData, "value", top)
	console.log("To", rootData.value)

	editor.editStack.redoStack.push(top)
	editor.editStack.snapshot = _cloneDeep(rootData.value)

	await focusDataByPath(rootBinding, invPath)
}

export function redoEditorAction(editor: DataEditor, rootData: Ref<object>) {
	const top = editor.editStack.redoStack.pop()
	if (!top) return

	applyDataDiff(rootData, "value", top)
	editor.editStack.undoStack.push(top)
	editor.editStack.snapshot = _cloneDeep(rootData.value)
}

function commitDataChange(editor: DataEditor, rootData: MaybeRefOrGetter<any>) {
	const data = toValue(rootData)
	const diff = computeDataDiff(editor.editStack.snapshot, data)

	if (diff == undefined) return

	//const caller = new Error().stack?.split("\n")[2]?.trim().split(" ")[1]
	//console.log("   - Commiting Undo", new Error().stack, caller, diff)

	editor.editStack.undoStack.push(diff)
	editor.editStack.snapshot = _cloneDeep(data)
	editor.editStack.redoStack = []
}

function commitSubDataChange(editor: DataEditor, rootData: MaybeRefOrGetter<any>, path: string) {
	const data = toValue(rootData)
	const diff = computeSubDataDiff(editor.editStack.snapshot, data, path)

	if (diff == undefined) return

	//const caller = new Error().stack?.split("\n")[2]?.trim().split(" ")[1]
	//console.log("   - Commiting Undo", new Error().stack, caller, diff)

	editor.editStack.undoStack.push(diff)
	editor.editStack.snapshot = _cloneDeep(data)
	editor.editStack.redoStack = []
}

export function useCommitUndo<T>() {
	const editor = useDataEditor()
	const path = useDataPath()
	const rootData = useRootData()

	return function () {
		commitDataChange(editor.value, rootData)
	}
}

// export function useDelayedCommitUndo() {
// 	const databinding = useBaseDataBinding()
// 	const editor = useDataEditor()

// 	return function () {
// 		if (databinding.delayedCommit) return
// 		databinding.delayedCommit = true
// 		nextTick(() => {
// 			commitDataView(editor.value)
// 			databinding.delayedCommit = false
// 		})
// 	}
// }

export function useUndoCommitter<T>(valueRef: Ref<T>) {
	const commitUndo = useCommitUndo()

	return computed({
		get() {
			return valueRef.value
		},
		set(v) {
			valueRef.value = v
			commitUndo()
		},
	})
}

// hello

export function useTextUndoCommitter(inputElement: MaybeRefOrGetter<HTMLElement | undefined>) {
	const commitUndo = useCommitUndo()

	const lastInputType = ref<string>()

	useEventListener(inputElement, "beforeinput", (ev: InputEvent) => {
		const inputTypeChanged = lastInputType.value != null && lastInputType.value != ev.inputType

		if (ev.inputType == "insertText") {
			if (ev.data == " " || inputTypeChanged) {
				commitUndo()
			}
		} else if (ev.inputType == "deleteContentBackward") {
			//No way to determine what was deleted :(
			if (inputTypeChanged) {
				commitUndo()
			}
		} else if (ev.inputType == "deleteContentForward") {
			//No way to determine what was deleted :(
			if (inputTypeChanged) {
				commitUndo()
			}
		} else {
			commitUndo()
		}

		lastInputType.value = ev.inputType
	})

	// useEventListener(inputElement, "selectionchange", (ev) => {
	// 	if (lastInputType.value != null) {
	// 		lastInputType.value = undefined
	// 		commitUndo()
	// 	}
	// })

	useEventListener(inputElement, "keydown", (ev) => {
		if (ev.ctrlKey && ev.key == "z") {
			commitUndo()
			ev.preventDefault()
		}
	})

	useEventListener(inputElement, "blur", (ev) => {
		lastInputType.value = undefined
		commitUndo()
	})
}
