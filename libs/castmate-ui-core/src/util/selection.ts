import { useEventListener } from "@vueuse/core"
import { MaybeRefOrGetter, ref, toValue, computed } from "vue"
import { getInternalMousePos } from "./dom"
import { Selection, useDocumentPath, useDocumentSelection, useSetDocumentSelection } from "./document"
import _uniq from "lodash/uniq"

export interface SelectionPos {
	x: number
	y: number
}

type SelectionMode = "overwrite" | "add" | "remove"

export function useSelectionRect(
	elem: MaybeRefOrGetter<HTMLElement | null | undefined>,
	collectSelection: (from: SelectionPos, to: SelectionPos) => Selection,
	path: MaybeRefOrGetter<string> = useDocumentPath()
) {
	const selecting = ref(false)
	const selectionStart = ref<{ x: number; y: number } | null>(null)
	const selectionEnd = ref<{ x: number; y: number } | null>(null)
	const selectionMode = ref<SelectionMode>("overwrite")

	function cancelSelection() {
		selecting.value = false
		selectionStart.value = null
		selectionEnd.value = null
		selectionMode.value = "overwrite"
	}

	const selection = useDocumentSelection(path)
	const oldSelection = ref<Selection>([])

	const from = computed<SelectionPos | null>(() => {
		if (!selecting.value) {
			return null
		}

		const sx = selectionStart.value?.x ?? 0
		const sy = selectionStart.value?.y ?? 0

		const ex = selectionEnd.value?.x ?? sx
		const ey = selectionEnd.value?.y ?? sy

		return {
			x: sx < ex ? sx : ex,
			y: sy < ey ? sy : ey,
		}
	})

	const to = computed<SelectionPos | null>(() => {
		if (!selecting.value) {
			return null
		}

		const sx = selectionStart.value?.x ?? 0
		const sy = selectionStart.value?.y ?? 0

		const ex = selectionEnd.value?.x ?? sx
		const ey = selectionEnd.value?.y ?? sy

		return {
			x: sx > ex ? sx : ex,
			y: sy > ey ? sy : ey,
		}
	})

	function isSelecting() {
		return selecting.value
	}

	function updateEnd(ev: MouseEvent) {
		const element = toValue(elem)

		if (!element) {
			return
		}

		const end = getInternalMousePos(element, ev)
		selectionEnd.value = end
	}

	function doSelectionCollect() {
		if (!from.value || !to.value) return

		const draggedIds = collectSelection(from.value, to.value)

		let newSelection: Selection

		if (selectionMode.value == "add") {
			newSelection = _uniq([...oldSelection.value, ...draggedIds])
		} else if (selectionMode.value == "remove") {
			newSelection = oldSelection.value.filter((id) => !draggedIds.includes(id))
		} else {
			newSelection = draggedIds
		}

		selection.value = newSelection
	}

	useEventListener(elem, "mousedown", (ev: MouseEvent) => {
		const element = toValue(elem)

		if (!element) {
			return
		}

		if (ev.button != 0) {
			return
		}

		selecting.value = true
		selectionStart.value = getInternalMousePos(element, ev)
		if (ev.shiftKey) {
			selectionMode.value = "add"
		} else if (ev.ctrlKey) {
			selectionMode.value = "remove"
		} else {
			selectionMode.value = "overwrite"
		}
		oldSelection.value = [...selection.value]

		console.log("Select Start", toValue(path))

		//ev.preventDefault()
		//ev.stopPropagation()
	})

	useEventListener("mousemove", (ev: MouseEvent) => {
		const element = toValue(elem)

		if (!element) {
			return
		}

		if (!isSelecting()) {
			return
		}

		updateEnd(ev)
		doSelectionCollect()
		ev.preventDefault()
	})

	useEventListener("mouseup", (ev: MouseEvent) => {
		const element = toValue(elem)

		if (!element) {
			return
		}

		if (ev.button != 0) {
			return
		}

		if (!isSelecting()) {
			return
		}

		console.log("Select End", toValue(path))

		updateEnd(ev)
		doSelectionCollect()
		cancelSelection()

		ev.preventDefault()
		ev.stopPropagation()
	})

	return {
		selecting,
		from,
		to,
		cancelSelection,
	}
}
