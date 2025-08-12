import { Arrayable, useElementBounding, useEventListener } from "@vueuse/core"
import { type MaybeRefOrGetter, toValue, onMounted, watch, onUnmounted, ref, Ref, computed } from "vue"
import { getElementRelativeRect, getInternalMousePos, isChildOfClass, usePropagationStop } from "./dom"

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
	element: MaybeRefOrGetter<HTMLElement | null | undefined>,
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
	element: MaybeRefOrGetter<HTMLElement | null | undefined>,
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
	element: MaybeRefOrGetter<HTMLElement | null | undefined>,
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
	element: MaybeRefOrGetter<HTMLElement | null | undefined>,
	dragDataTypes: MaybeRefOrGetter<Arrayable<string>>,
	func: (ev: DragEventWithDataTransfer) => any
) {
	const stopPropagation = usePropagationStop()

	useEventListener(element, "drop", (ev: DragEvent) => {
		if (!isDragRelevent(ev, dragDataTypes)) return

		stopPropagation(ev)
		ev.preventDefault()

		func(ev)
	})
}

export function useDragStart(
	element: MaybeRefOrGetter<HTMLElement | null | undefined>,
	handleClass: MaybeRefOrGetter<string>,
	func: (ev: DragEventWithDataTransfer) => any
) {
	const dragTarget = ref<HTMLElement>()
	const stopPropagation = usePropagationStop()

	useEventListener(element, "mousedown", (ev: MouseEvent) => {
		dragTarget.value = ev.target as HTMLElement
		if (isChildOfClass(dragTarget.value, toValue(handleClass))) {
			stopPropagation(ev)
		}
	})

	useEventListener(element, "dragstart", (ev: DragEvent) => {
		if (!ev.target) return
		if (!ev.dataTransfer) return

		if (!dragTarget.value || !isChildOfClass(dragTarget.value, toValue(handleClass))) {
			ev.preventDefault()
			ev.stopPropagation()
			return //Don't drag!
		}

		func(ev as DragEventWithDataTransfer)

		ev.stopPropagation()
	})
}

export function useDragEnd(
	element: MaybeRefOrGetter<HTMLElement | null | undefined>,
	func: (ev: DragEventWithDataTransfer) => any
) {
	useEventListener(element, "dragend", (ev: DragEvent) => {
		if (!ev.target) return
		if (!ev.dataTransfer) return

		func(ev as DragEventWithDataTransfer)
	})
}

function markDraggable(elements: MaybeRefOrGetter<Arrayable<HTMLElement>>) {
	onMounted(() => {
		const elementsValue = toValue(elements)
		const elemArray = Array.isArray(elementsValue) ? elementsValue : [elementsValue]

		for (const elem of elemArray) {
			elem.draggable = true
		}
	})

	watch(elements, (value, old) => {
		const newValue = toValue(value)
		const newArray = Array.isArray(newValue) ? newValue : [newValue]

		const oldValue = toValue(old)
		const oldArray = Array.isArray(oldValue) ? oldValue : [oldValue]

		for (const elem of newArray) {
			elem.draggable = true
		}

		for (const elem of oldArray) {
			if (newArray.includes(elem)) continue
			elem.draggable = false
		}
	})
}

export function useDraggable(
	elements: MaybeRefOrGetter<Arrayable<HTMLElement>>,
	handleClass: MaybeRefOrGetter<string>,
	func: (index: number, ev: DragEvent) => any
) {
	onMounted(() => {})
}

export function useDragValue(
	element: MaybeRefOrGetter<HTMLElement | undefined>,
	numRef: Ref<number | undefined>,
	config?: MaybeRefOrGetter<{
		direction?: "horizontal" | "vertical" | "up-left" | "up-right" | "down-left" | "down-right"
		scale?: number
		invert?: boolean
		min?: number
		max?: number
	}>,
	dragComplete?: () => any
) {
	const dragStart = ref({ x: 0, y: 0 })
	const dragStartValue = ref(0)
	const dragging = ref(false)

	useEventListener(element, "mousedown", (ev) => {
		const pos = getInternalMousePos(toValue(element), ev)

		console.log("Drag Value Start")

		dragging.value = true
		dragStart.value = pos
		dragStartValue.value = numRef.value ?? 0
	})

	function updateNumber(ev: MouseEvent) {
		const configValue = toValue(config)
		const pos = getInternalMousePos(toValue(element), ev)

		let offset: number
		if (configValue?.direction == "vertical") {
			offset = pos.y - dragStart.value.y
		} else if (configValue?.direction == "horizontal") {
			//Horizontal
			offset = pos.x - dragStart.value.x
		} else {
			let dx = pos.x - dragStart.value.x
			let dy = pos.y - dragStart.value.y

			if (configValue?.direction == "up-left" || configValue?.direction == "up-right") {
				dy = -dy
			}
			if (configValue?.direction == "up-left" || configValue?.direction == "down-left") {
				dx = -dx
			}

			offset = Math.max(dx, dy)
		}

		if (configValue?.invert) {
			offset = -offset
		}

		let targetValue = Math.round(dragStartValue.value + offset / (configValue?.scale ?? 1))

		if (configValue?.min != null) {
			targetValue = Math.max(configValue.min, targetValue)
		}

		if (configValue?.max != null) {
			targetValue = Math.min(configValue.max, targetValue)
		}

		numRef.value = targetValue
	}

	useEventListener(
		() => (dragging.value ? window : undefined),
		"mousemove",
		(ev: MouseEvent) => {
			updateNumber(ev)
			console.log("Drag Value Move")
		}
	)

	useEventListener(
		() => (dragging.value ? window : undefined),
		"mouseup",
		(ev: MouseEvent) => {
			updateNumber(ev)
			dragging.value = false
			dragComplete?.()
			console.log("Drag Value End")
		}
	)

	return computed(() => {
		return dragging.value
	})
}

export function useDragAngle(
	element: MaybeRefOrGetter<HTMLElement | undefined | null>,
	numRef: Ref<number | undefined>,
	config?: MaybeRefOrGetter<{
		min?: number
		max?: number
	}>,
	dragComplete?: () => any
) {
	const bounds = useElementBounding(element)

	const dragging = ref(false)

	useEventListener(element, "mousedown", (ev) => {
		dragging.value = true
	})

	function updateNumber(ev: MouseEvent) {
		const mousePos = { x: ev.clientX, y: ev.clientY }
		const centerPos = {
			x: (bounds.right.value + bounds.left.value) / 2,
			y: (bounds.bottom.value + bounds.top.value) / 2,
		}

		const offset = {
			x: mousePos.x - centerPos.x,
			y: mousePos.y - centerPos.y,
		}

		const angleRad = Math.atan2(offset.y, offset.x)
		let angleDeg = (angleRad * 180) / Math.PI

		if (ev.shiftKey) {
			angleDeg = Math.round(angleDeg / 45) * 45
			if (angleDeg == 360) angleDeg = 0
		}

		numRef.value = angleDeg
	}

	useEventListener(
		() => (dragging.value ? window : undefined),
		"mousemove",
		(ev: MouseEvent) => {
			updateNumber(ev)
			//console.log("Drag Value Move")
		}
	)

	useEventListener(
		() => (dragging.value ? window : undefined),
		"mouseup",
		(ev: MouseEvent) => {
			updateNumber(ev)
			dragging.value = false
			dragComplete?.()
			//console.log("Drag Value End")
		}
	)

	return computed(() => {
		return dragging.value
	})
}
