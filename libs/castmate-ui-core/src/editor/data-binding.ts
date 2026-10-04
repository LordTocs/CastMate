import {
	computed,
	ComputedRef,
	inject,
	MaybeRefOrGetter,
	nextTick,
	onBeforeMount,
	onBeforeUnmount,
	onMounted,
	provide,
	Ref,
	ref,
	toValue,
	watch,
	watchEffect,
	queuePostFlushCb,
} from "vue"
import { provideLocal, injectLocal, useEventListener, toReactive } from "@vueuse/core"
import { nanoid } from "nanoid/non-secure"

import _cloneDeep from "lodash/cloneDeep"
import {
	DataEditor,
	joinDataPath,
	applyDataDiff,
	applyInvDataDiff,
	computeDataDiff,
	getInvDataDiffPath,
} from "castmate-schema"
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

//Handles document pathing like a.b[2].c
function parsePath(path: string) {
	return path.split(/\.|\[|\]\.?/i).filter((v) => v.length > 0)
}

export function useParentDataPath() {
	return inject<ComputedRef<string>>(
		"ui-data-path",
		computed(() => "")
	)
}

export function useDataPath() {
	return injectLocal<ComputedRef<string>>(
		"ui-data-path",
		computed(() => "")
	)
}

export function provideLocalPath(localPath: MaybeRefOrGetter<string | undefined>) {
	const parentPath = useParentDataPath()

	const ourPath = computed(() => {
		const actualLocalPath = toValue(localPath)
		return joinDataPath(parentPath.value, actualLocalPath)
	})

	provideLocal("ui-data-path", ourPath)

	return ourPath
}

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

export interface DataUIBinding {
	focus?(): any
	scrollIntoView?(): any
	onChildFocus?(parsedPath: string[]): any
	onChildScrollIntoView?(parsedPath: string[]): any
}

export interface DataPathBinding {
	subPaths: Record<PropertyKey, DataPathBinding>
	uiBindings: DataUIBinding[]
	refCount: number
}

function registerDataUiBinding(pathView: DataPathBinding, binding: DataUIBinding) {
	pathView.uiBindings.push(binding)
}

function unregisterDataUiBinding(pathView: DataPathBinding, binding: DataUIBinding) {
	const idx = pathView.uiBindings.findIndex((uib) => uib === binding)
	if (idx < 0) return
	pathView.uiBindings.splice(idx, 1)
}

export interface RootDataBinding {
	id: string
	delayedCommit: boolean
	rootPath: DataPathBinding
	editor: DataEditor
}

export function createRootDataBinding(editor: DataEditor): RootDataBinding {
	return {
		id: nanoid(),
		delayedCommit: false,
		editor,
		rootPath: {
			subPaths: {},
			uiBindings: [],
			refCount: 0,
		},
	}
}

///

function commitDataView(dataBinding: RootDataBinding) {
	const newData = dataBinding.editor.data
	const diff = computeDataDiff(dataBinding.rootPath.snapshot, newData)

	if (diff == undefined) return

	//const caller = new Error().stack?.split("\n")[2]?.trim().split(" ")[1]
	//console.log("   - Commiting Undo", new Error().stack, caller, diff)

	dataBinding.editor.editStack.undoStack.push(diff)
	dataBinding.editor.editStack.snapshot = _cloneDeep(newData)
	dataBinding.editor.editStack.redoStack = []
}

export function useCommitUndo() {
	const databinding = useBaseDataBinding()

	return function () {
		commitDataView(databinding)
	}
}

export function useDelayedCommitUndo() {
	const databinding = useBaseDataBinding()

	return function () {
		if (databinding.delayedCommit) return
		databinding.delayedCommit = true
		nextTick(() => {
			commitDataView(databinding)
			databinding.delayedCommit = false
		})
	}
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

export function provideBaseDataBinding(binding: MaybeRefOrGetter<RootDataBinding | undefined>) {
	provideLocal("ui-data-binding", toReactive(computed(() => toValue(binding) ?? createRootDataBinding(undefined))))
}

export function useBaseDataBinding() {
	return injectLocal<RootDataBinding>("ui-data-binding", createRootDataBinding(undefined))
}

export function useLocalDataBinding() {
	const baseBinding = useBaseDataBinding()
	const path = useDataPath()

	return computed(() => getDataBindingByPath(baseBinding, path.value))
}

export function useLocalViewData() {
	const baseBinding = useBaseDataBinding()
	const path = useDataPath()

	return computed(() => getViewDataByPath(baseBinding, path.value))
}

export function useDataUIBinding(uiBinding: MaybeRefOrGetter<DataUIBinding>, debug?: MaybeRefOrGetter<string>) {
	const localPath = useDataPath()
	const localBinding = useLocalDataBinding()
	const currentBinding = ref<DataUIBinding>()

	onBeforeMount(() => {
		watch(
			[localBinding, () => toValue(uiBinding)],
			([view, binding], [oldView, oldBinding]) => {
				if (oldView != null && oldBinding != null) {
					unregisterDataUiBinding(oldView, oldBinding)
					currentBinding.value = undefined
				}

				//console.log("OnBeforeMount Data UI Binding", toValue(debug), localPath.value)
				if (view) {
					registerDataUiBinding(view, binding)
					currentBinding.value = binding
				}
			},
			{ immediate: true }
		)
	})

	onBeforeUnmount(() => {
		//console.log("OnBeforeUnmount Data UI Binding", toValue(debug), localPath.value)
		if (localBinding.value && currentBinding.value) {
			unregisterDataUiBinding(localBinding.value, currentBinding.value)
		}
	})
}

export function useDataBinding(localPath: MaybeRefOrGetter<string | undefined>) {
	const baseBinding = useBaseDataBinding()

	const fullPath = provideLocalPath(localPath)

	const parentPath = useParentDataPath()

	onBeforeMount(() => {
		watch(
			() => toValue(localPath),
			(value, oldValue) => {
				if (oldValue) {
					const oldPath = joinDataPath(parentPath.value, oldValue)
					deleteDataBinding(baseBinding, oldPath)
					//TODO: Should this be some sort of move?
				}

				if (value) {
					const newPath = joinDataPath(parentPath.value, value)
					ensureDataBinding(baseBinding, newPath)
				}
			},
			{ immediate: true }
		)
	})

	onBeforeUnmount(() => {
		const local = toValue(localPath)
		if (local) {
			deleteDataBinding(baseBinding, fullPath.value)
		}
	})
}

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

function nextTickAsync() {
	return new Promise<void>((resolve, reject) => {
		nextTick(() => {
			resolve()
		})
	})
}

export async function focusDataByPath(root: RootDataBinding, path: string) {
	const parsedPath = parsePath(path)

	console.log("FOCUS PATH", parsedPath)

	let base = root.rootPath

	for (let i = 0; i < parsedPath.length; ++i) {
		const trace = parsedPath[i]

		const subPath = parsedPath.slice(i)

		if (base == null) return undefined

		for (const binding of base.uiBindings) {
			if (binding?.onChildFocus) {
				await binding.onChildFocus(subPath)
				await nextTickAsync()
			}
		}

		base = base.subPaths[trace]

		console.log("    - Found ", trace, base)
	}

	if (!base) return

	for (const binding of base.uiBindings) {
		await binding?.focus?.()
	}
}

export async function scrollIntoViewDataByPath(root: RootDataBinding, path: string) {
	const parsedPath = parsePath(path)

	let base = root.rootPath
	for (let i = 0; i < parsedPath.length; ++i) {
		const trace = parsedPath[i]

		const subPath = parsedPath.slice(i + 1)
		if (base == null) return undefined

		for (const binding of base.uiBindings) {
			await binding?.onChildScrollIntoView?.(subPath)
		}

		base = base.subPaths[trace]
	}

	for (const binding of base.uiBindings) {
		await binding?.scrollIntoView?.()
	}
}

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

export function getDataBindingByPath(root: RootDataBinding, path: string) {
	const pathParsed = parsePath(path)

	let base = root.rootPath
	for (const trace of pathParsed) {
		if (base == null) return undefined

		base = base.subPaths[trace]
	}
	return base
}

export function getViewDataByPath(root: RootDataBinding, path: string) {
	const pathParsed = parsePath(path)

	let base = root.editor.view
	for (const trace of pathParsed) {
		if (base == null) return undefined

		base = base.subPaths[trace]
	}
	return base
}

function createEmptyPathData(): DataPathBinding {
	return {
		subPaths: {},
		uiBindings: [],
		refCount: 0,
	}
}

function ensureDataBinding(root: RootDataBinding, path: string, pathData?: DataPathBinding) {
	const parsed = parsePath(path)

	const data: DataPathBinding = pathData ?? createEmptyPathData()

	let base = root.rootPath
	//console.log("Ensuring", root, parsed)
	for (let i = 0; i < parsed.length; ++i) {
		const trace = parsed[i]

		if (!(trace in base.subPaths)) {
			//If we're the last path in the parsed list insert the data, otherwise make an empty
			base.subPaths[trace] = i == parsed.length - 1 ? data : createEmptyPathData()
		}

		base = base.subPaths[trace]
	}

	base.refCount++

	return base
}

function deleteDataBinding(root: RootDataBinding, path: string) {
	const pathParsed = parsePath(path)

	let base = root.rootPath
	for (let i = 0; i < pathParsed.length - 1; ++i) {
		if (!base) return

		const trace = pathParsed[i]
		if (!(trace in base.subPaths)) {
			return
		}

		base = base.subPaths[trace]
	}

	const toDelete = base.subPaths[pathParsed[pathParsed.length - 1]]
	if (!toDelete) return
	if (--toDelete.refCount == 0) {
		delete base.subPaths[pathParsed[pathParsed.length - 1]]
	}
}

//TODO: moveDataView() - What to do about refCount > 1

export async function undoDataView(dataBinding: RootDataBinding) {
	const top = dataBinding.editor.editStack.undoStack.pop()

	if (!top) return

	const invPath = getInvDataDiffPath(top)

	console.log("From", dataBinding.editor.data, getInvDataDiffPath(top))
	applyInvDataDiff(dataBinding.editor, "data", top)
	console.log("To", dataBinding.editor.data)

	dataBinding.editor.editStack.redoStack.push(top)

	dataBinding.editor.editStack.undoStack.snapshot = _cloneDeep(dataBinding.editor.data)

	await focusDataByPath(dataBinding, invPath)
}

export function redoDataView(dataBinding: RootDataBinding) {
	const top = dataBinding.editor.editStack.redoStack.pop()

	if (!top) return

	applyDataDiff(dataBinding.editor, "data", top)
	dataBinding.editor.editStack.undoStack.push(top)

	dataBinding.editor.editStack.snapshot = _cloneDeep(dataBinding.editor.data)
}
