import { WritableComputedRef, computed, MaybeRef, customRef, watch, watchEffect, toValue } from "vue"
import { computeDataDiff } from "./diff"
import {
	MaybeElementRef,
	MaybeRefOrGetter,
	isDef,
	onKeyPressed,
	unrefElement,
	useActiveElement,
	useFocusWithin,
	useVModel,
	useWindowFocus,
} from "@vueuse/core"

interface PropType<T> {
	[key: string]: T
}

type UndoRef<T> = WritableComputedRef<T> & {
	undo: () => void
	redo: () => void
}

export function useUndoModel<P extends object, K extends keyof P>(
	props: P,
	key: K,
	emit: (str: string, ...args: any[]) => void
) {
	const undoStack: ReturnType<typeof computeDataDiff>[] = []
	const redoStack: ReturnType<typeof computeDataDiff>[] = []

	const activeElement = useActiveElement()

	const event = `update:${String(key)}`

	const getValue = () => props[key]

	const emitValue = (v: P[K]) => emit(event, v)

	const modelObj: UndoRef<P[K]> = computed<P[K]>({
		get() {
			return getValue()
		},
		set(newValue: P[K]) {
			const current = props[key]
			const diff = computeDataDiff(current, newValue)
			undoStack.push(diff)
			redoStack.splice(0, redoStack.length)

			emitValue(newValue)
		},
	}) as UndoRef<P[K]>

	function undo() {
		const topDiff = undoStack.pop()

		if (!topDiff) {
			return
		}

		const result = getValue() //Revert Diff

		redoStack.push(topDiff)

		emitValue(result)
	}

	function redo() {
		const topDiff = redoStack.pop()

		if (!topDiff) {
			return
		}

		const result = getValue()

		undoStack.push(topDiff)

		emitValue(result)
	}

	modelObj.undo = undo
	modelObj.redo = redo
	return modelObj
}

export function useUndoableDocument<P extends object, K extends keyof P>(
	element: MaybeRef<HTMLElement | undefined>,
	props: P,
	key: K,
	emit: (name: string, ...args: any[]) => void
) {
	const undoModel = useUndoModel(props, key, emit)

	const { focused } = useFocusWithin(element)

	onKeyPressed(
		"z",
		(e) => {
			if (focused.value && e.ctrlKey) {
				undoModel.undo()
				e.preventDefault()
				e.stopPropagation()
				return false
			}
		},
		{ target: element }
	)

	onKeyPressed(
		"y",
		(e) => {
			if (focused.value && e.ctrlKey) {
				undoModel.redo()
				e.preventDefault()
				e.stopPropagation()
				return false
			}
		},
		{ target: element }
	)

	return undoModel
}
