import {
	computed,
	ComputedRef,
	inject,
	MaybeRefOrGetter,
	onBeforeMount,
	onBeforeUnmount,
	onMounted,
	provide,
	Ref,
	ref,
	toValue,
	watch,
	watchEffect,
} from "vue"
import { provideLocal, injectLocal, useEventListener } from "@vueuse/core"
import { computeDataDiff, DataDiff } from "./diff"

import _cloneDeep from "lodash/cloneDeep"
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

//Handles document pathing like a.b[2].c
function parsePath(path: string) {
	return path.split(/\./i)
}

export function joinDataPath(...paths: (string | undefined)[]) {
	let result = ""
	for (const path of paths) {
		if (!path) {
			continue
		}
		if (result.length > 0) {
			const separator = "."
			result += separator
		}
		result += path
	}

	return result
}

export function useDataPath() {
	return injectLocal<ComputedRef<string>>(
		"ui-data-path",
		computed(() => "")
	)
}

export function provideLocalPath(localPath: MaybeRefOrGetter<string | undefined>) {
	const parentPath = useDataPath()

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
	onChildFocus?(): any
	onChildScrollIntoView?(): any
}

export interface DataPathView {
	data: Record<PropertyKey, any>
	subPaths: Record<PropertyKey, DataPathView>
	uiBindings: DataUIBinding[]
	refCount: number
}

function registerDataUiBinding(pathView: DataPathView, binding: DataUIBinding) {
	pathView.uiBindings.push(binding)
}

function unregisterDataUiBinding(pathView: DataPathView, binding: DataUIBinding) {
	const idx = pathView.uiBindings.findIndex((uib) => uib === binding)
	if (idx < 0) return
	pathView.uiBindings.splice(idx, 1)
}

export interface UndoStack<T = any> {
	stack: DataDiff[]
	snapshot: T
}
export function createUndoStack<T = any>(initialValue: T): UndoStack {
	return {
		stack: [],
		snapshot: initialValue,
	}
}
export interface DataBinding {
	rootData: any
	rootView: DataPathView
	undoStack: UndoStack
}

///

export function useCommitUndo() {
	const databinding = useBaseDataBinding()

	return function () {
		const newData = databinding.rootData
		const diff = computeDataDiff(databinding.undoStack.snapshot, newData)

		if (diff == undefined) return

		databinding.undoStack.stack.push(diff)
		databinding.undoStack.snapshot = _cloneDeep(newData)
	}
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

	useEventListener(inputElement, "blur", (ev) => {
		lastInputType.value = undefined
		commitUndo()
	})
}

export function provideBaseDataBinding(binding: DataBinding) {
	provide("ui-data-binding", binding)
}

export function useBaseDataBinding() {
	return inject<DataBinding>("ui-data-binding", {
		rootData: undefined,
		rootView: { data: {}, subPaths: {}, uiBindings: [], refCount: 1 },
		undoStack: createUndoStack({}),
	})
}

export function useLocalDataBinding() {
	const baseBinding = useBaseDataBinding()
	const path = useDataPath()

	return computed(() => getDataViewByPath(baseBinding.rootView, path.value))
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

export function useDataBinding(localPath: MaybeRefOrGetter<string>) {
	const baseBinding = useBaseDataBinding()

	const fullPath = provideLocalPath(localPath)

	onBeforeMount(() => {
		console.log("onBeforeMount DataBinding", fullPath.value)
		ensureDataView(baseBinding.rootView, fullPath.value)
	})

	onBeforeUnmount(() => {
		console.log("onBeforeUnmount DataBinding", fullPath.value)
		deleteDataView(baseBinding.rootView, fullPath.value)
	})

	const view = computed(() => {
		return getDataViewByPath(baseBinding.rootView, fullPath.value)
	})

	return view
}

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

export async function focusDataByPath(root: DataPathView, path: string) {
	const parsedPath = parsePath(path)

	let base = root
	for (const trace of parsedPath) {
		if (base == null) return undefined

		for (const binding of base.uiBindings) {
			await binding?.onChildFocus?.()
		}

		base = base.subPaths[trace]
	}

	for (const binding of base.uiBindings) {
		await binding?.focus?.()
	}
}

export async function scrollIntoViewDataByPath(root: DataPathView, path: string) {
	const parsedPath = parsePath(path)

	let base = root
	for (const trace of parsedPath) {
		if (base == null) return undefined

		for (const binding of base.uiBindings) {
			await binding?.onChildScrollIntoView?.()
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

export function getDataViewByPath(root: DataPathView, path: string) {
	const pathParsed = parsePath(path)

	let base = root
	for (const trace of pathParsed) {
		if (base == null) return undefined

		base = base.subPaths[trace]
	}
	return base
}

function ensureDataView(root: DataPathView, path: string) {
	const pathParsed = parsePath(path)

	let base = root
	//console.log("Ensuring", root, path)
	for (const trace of pathParsed) {
		if (!(trace in base.subPaths)) {
			base.subPaths[trace] = {
				data: {},
				subPaths: {},
				uiBindings: [],
				refCount: 0,
			}
		}

		base = base.subPaths[trace]
	}

	base.refCount++

	return base
}

function deleteDataView(root: DataPathView, path: string) {
	const pathParsed = parsePath(path)

	let base = root
	for (let i = 0; i < pathParsed.length - 1; ++i) {
		const trace = pathParsed[i]
		if (!(trace in base.subPaths)) {
			return
		}

		base = base.subPaths[trace]
	}

	const toDelete = base.subPaths[pathParsed[pathParsed.length - 1]]
	if (--toDelete.refCount == 0) {
		delete base.subPaths[pathParsed[pathParsed.length - 1]]
	}
}
