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
import { applyInvDataDiff, computeDataDiff, DataDiff } from "./diff"

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

export function provideBaseDataBinding(binding: DataBinding) {
	provideLocal("ui-data-binding", binding)
}

export function useBaseDataBinding() {
	return injectLocal<DataBinding>("ui-data-binding", {
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
					deleteDataView(baseBinding.rootView, oldPath)
					//TODO: Should this be some sort of move?
				}

				if (value) {
					const newPath = joinDataPath(parentPath.value, value)
					ensureDataView(baseBinding.rootView, newPath)
				}
			},
			{ immediate: true }
		)
	})

	onBeforeUnmount(() => {
		const local = toValue(localPath)
		if (local) {
			deleteDataView(baseBinding.rootView, fullPath.value)
		}
	})
}

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

export async function focusDataByPath(root: DataPathView, path: string) {
	const parsedPath = parsePath(path)

	let base = root

	for (let i = 0; i < parsedPath.length; ++i) {
		const trace = parsedPath[i]

		const subPath = parsedPath.slice(i + 1)

		if (base == null) return undefined

		for (const binding of base.uiBindings) {
			await binding?.onChildFocus?.(subPath)
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

export function getDataViewByPath(root: DataPathView, path: string) {
	const pathParsed = parsePath(path)

	let base = root
	for (const trace of pathParsed) {
		if (base == null) return undefined

		base = base.subPaths[trace]
	}
	return base
}

function createEmptyPathData(): DataPathView {
	return {
		data: {},
		subPaths: {},
		uiBindings: [],
		refCount: 0,
	}
}

function ensureDataView(root: DataPathView, path: string, pathData?: DataPathView) {
	const parsed = parsePath(path)

	const data: DataPathView = pathData ?? createEmptyPathData()

	let base = root
	//console.log("Ensuring", root, path)
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

//TODO: moveDataView() - What to do about refCount > 1

///

export function useUndoEvents(element: MaybeRefOrGetter<HTMLElement | undefined>) {
	const baseDataBinding = useBaseDataBinding()

	useEventListener(element, "keydown", (ev) => {
		console.log(ev)
		if (ev.ctrlKey && ev.key == "z") {
			console.log("DOING UNDO", baseDataBinding)
			ev.stopPropagation()

			const top = baseDataBinding.undoStack.stack.pop()

			if (!top) return

			console.log("From", baseDataBinding.rootData)
			applyInvDataDiff(baseDataBinding, "rootData", top)
			console.log("To", baseDataBinding.rootData)

			baseDataBinding.undoStack.snapshot = _cloneDeep(baseDataBinding.rootData)
		}
	})
}
