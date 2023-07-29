import { Arrayable, useEventListener } from "@vueuse/core"
import { type MaybeRefOrGetter, toValue } from "vue"

export type DragEventWithDataTransfer = DragEvent & { dataTransfer: DataTransfer }

export function isDragRelevent(
	ev: DragEvent,
	dragDataTypes: MaybeRefOrGetter<Arrayable<string>>
): ev is DragEventWithDataTransfer {
	if (!ev.dataTransfer) return false

	const typesValue = toValue(dragDataTypes)
	const types = Array.isArray(typesValue) ? typesValue : [typesValue]

	let found = false
	for (let datatype of types) {
		if (ev.dataTransfer.types.includes(datatype)) {
			found = true
			break
		}
	}

	if (!found) return false

	return true
}

interface FromTo {
	fromElement?: HTMLElement
	toElement?: HTMLElement
}

export function useDragEnter(
	element: MaybeRefOrGetter<HTMLElement | null>,
	dragDataTypes: MaybeRefOrGetter<Arrayable<string>>,
	func: (ev: DragEventWithDataTransfer) => void
) {
	useEventListener(element, "dragenter", (ev: DragEvent) => {
		if (!isDragRelevent(ev, dragDataTypes)) return

		const elem = toValue(element)
		if (!elem) return

		const ft = ev as FromTo

		const fromIn = ft.fromElement != null && elem.contains(ft.fromElement)
		const toIn = ft.toElement != null && elem.contains(ft.toElement)

		//Left as
		//console.log("Enter", ft.fromElement?.className, "->", ft.toElement?.className, fromIn, toIn)

		if (fromIn) {
			return
		}

		ev.preventDefault()
		ev.stopPropagation()

		func(ev)
	})
}

export function useDragLeave(
	element: MaybeRefOrGetter<HTMLElement | null>,
	dragDataTypes: MaybeRefOrGetter<Arrayable<string>>,
	func: (ev: DragEventWithDataTransfer) => void
) {
	useEventListener(element, "dragleave", (ev: DragEvent) => {
		if (!isDragRelevent(ev, dragDataTypes)) return
		const elem = toValue(element)
		if (!elem) return

		const ft = ev as FromTo

		const fromIn = ft.fromElement != null && elem.contains(ft.fromElement)
		const toIn = ft.toElement != null && elem.contains(ft.toElement)

		//Left for debug purposes since from and to don't really make sense here
		//console.log("Leave", ft.fromElement?.className, "->", ft.toElement?.className, fromIn, toIn)

		if (fromIn) {
			return
		}

		ev.preventDefault()
		ev.stopPropagation()

		func(ev)
	})
}

export function useDragOver(
	element: MaybeRefOrGetter<HTMLElement | null>,
	dragDataTypes: MaybeRefOrGetter<Arrayable<string>>,
	func: (ev: DragEventWithDataTransfer) => void
) {
	useEventListener(element, "dragover", (ev: DragEvent) => {
		if (!isDragRelevent(ev, dragDataTypes)) return
		if (!toValue(element)) return

		ev.preventDefault()
		ev.stopPropagation()

		func(ev)
	})
}

export function useDrop(
	element: MaybeRefOrGetter<HTMLElement | null>,
	dragDataTypes: MaybeRefOrGetter<Arrayable<string>>,
	func: (ev: DragEventWithDataTransfer) => void
) {
	useEventListener(element, "drop", (ev: DragEvent) => {
		if (!isDragRelevent(ev, dragDataTypes)) return

		ev.stopPropagation()
		ev.preventDefault()

		func(ev)
	})
}
