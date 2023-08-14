import { useEventListener } from "@vueuse/core"
import { MaybeRefOrGetter, ref, toValue } from "vue"
import { getInternalMousePos } from "./dom"

export interface SelectionPos {
	x: number
	y: number
}

export function useSelectionRect(
	elem: MaybeRefOrGetter<HTMLElement | null | undefined>,
	selectionChanged: (from: SelectionPos, to: SelectionPos) => void
) {
	const selecting = ref(false)
	const selectionStart = ref<{ x: number; y: number } | null>(null)
	const selectionEnd = ref<{ x: number; y: number } | null>(null)

	function cancelSelection() {
		selecting.value = false
		selectionStart.value = null
		selectionEnd.value = null
	}

	useEventListener(elem, "mousedown", (ev: MouseEvent) => {
		console.log("Selection Mouse Down")
		const element = toValue(elem)

		if (!element) {
			return
		}

		if (ev.button != 0) {
			return
		}

		selecting.value = true
		selectionStart.value = getInternalMousePos(element, ev)
	})

	useEventListener("mousemove", (ev: MouseEvent) => {
		const element = toValue(elem)

		if (!element) {
			return
		}

		if (selecting.value && selectionStart.value) {
			const end = getInternalMousePos(element, ev)
			selectionEnd.value = end

			if (selectionStart.value.y < end.y) {
				selectionChanged(selectionStart.value, end)
			} else {
				selectionChanged(end, selectionStart.value)
			}
		}
	})

	useEventListener("mouseup", (ev: MouseEvent) => {
		const element = toValue(elem)

		if (!element) {
			return
		}

		if (selecting.value && selectionStart.value) {
			const end = getInternalMousePos(element, ev)
			if (selectionStart.value.y < end.y) {
				selectionChanged(selectionStart.value, end)
			} else {
				selectionChanged(end, selectionStart.value)
			}
		}

		cancelSelection()
	})

	return {
		selecting,
		selectionStart,
		selectionEnd,
		cancelSelection,
	}
}
