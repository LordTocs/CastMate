import { useEventListener } from "@vueuse/core"
import { MaybeRefOrGetter, ref, toValue, computed } from "vue"
import { getInternalMousePos } from "./dom"
import { Selection, useDocumentPath, useSetDocumentSelection } from "./document"

export interface SelectionPos {
	x: number
	y: number
}

export function useSelectionRect(
	elem: MaybeRefOrGetter<HTMLElement | null | undefined>,
	collectSelection: (from: SelectionPos, to: SelectionPos) => Selection,
	path: MaybeRefOrGetter<string> = useDocumentPath()
) {
	const selecting = ref(false)
	const selectionStart = ref<{ x: number; y: number } | null>(null)
	const selectionEnd = ref<{ x: number; y: number } | null>(null)

	function cancelSelection() {
		selecting.value = false
		selectionStart.value = null
		selectionEnd.value = null
	}

	const setSelection = useSetDocumentSelection()

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

		const newSelection = collectSelection(from.value, to.value)

		setSelection({
			container: toValue(path),
			items: newSelection,
		})
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

		ev.preventDefault()
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
