import { useEventListener } from "@vueuse/core"
import { DomHandler } from "primevue/utils"
import { computed, MaybeRefOrGetter, toValue, ref, toRaw, nextTick, provide, inject, ComputedRef } from "vue"

export function isChildOfClass(element: HTMLElement, clazz: string) {
	if (element.classList.contains(clazz)) return true

	let parent = element.parentElement
	while (parent) {
		if (parent.classList.contains(clazz)) return true
		parent = parent.parentElement
	}

	return false
}

export function getElementScroll(elem: HTMLElement) {
	return { x: elem.scrollLeft ?? 0, y: elem.scrollTop ?? 0 }
}

export interface ClientPosition {
	readonly clientX: number
	readonly clientY: number
}

export interface DOMPos {
	x: number
	y: number
}

export function getInternalMousePos(elem: HTMLElement, ev: ClientPosition): DOMPos {
	const rect = elem.getBoundingClientRect()
	const scroll = getElementScroll(elem)

	return { x: ev.clientX - rect.x + scroll.x, y: ev.clientY - rect.y + scroll.y }
}

export function rectangleOverlaps(r1: DOMRect, r2: DOMRect) {
	return r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top
}

export function useDOMRect(
	p1: MaybeRefOrGetter<DOMPos | undefined | null>,
	p2: MaybeRefOrGetter<DOMPos | undefined | null>
) {
	return computed(() => {
		const p1Value = toValue(p1)
		const p2Value = toValue(p2)

		if (p1Value == null || p2Value == null) return undefined

		const minX = Math.min(p1Value.x, p2Value.x)
		const maxX = Math.max(p1Value.x, p2Value.x)
		const minY = Math.min(p1Value.y, p2Value.y)
		const maxY = Math.max(p1Value.y, p2Value.y)

		return DOMRect.fromRect({
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY,
		})
	})
}

export interface DragState {
	from: DOMPos | null
	to: DOMPos | null
	dragRect: DOMRect | null
}

export function useClickDragRect(
	container: MaybeRefOrGetter<HTMLElement | null | undefined>,
	onStart?: (dragState: DragState) => any,
	onFinished?: (dragState: DragState) => any,
	onUpdate?: (dragState: DragState) => any
) {
	const couldDrag = ref(false)
	const dragging = ref(false)

	const dragStart = ref<DOMPos | null>(null)
	const dragEnd = ref<DOMPos | null>(null)

	const from = computed<DOMPos | null>(() => {
		if (!dragStart.value) {
			return null
		}

		const sx = dragStart.value.x
		const sy = dragStart.value.y

		const ex = dragEnd.value?.x ?? sx
		const ey = dragEnd.value?.y ?? sy

		return {
			x: sx < ex ? sx : ex,
			y: sy < ey ? sy : ey,
		}
	})

	const to = computed<DOMPos | null>(() => {
		if (!dragStart.value || !dragEnd.value) {
			return null
		}

		const sx = dragStart.value?.x ?? 0
		const sy = dragStart.value?.y ?? 0

		const ex = dragEnd.value?.x ?? sx
		const ey = dragEnd.value?.y ?? sy

		return {
			x: sx > ex ? sx : ex,
			y: sy > ey ? sy : ey,
		}
	})

	const dragRect = computed<DOMRect | null>(() => {
		if (!from.value || !to.value) return null

		return DOMRect.fromRect({
			x: from.value.x,
			y: from.value.y,
			width: to.value.x - from.value.x,
			height: to.value.y - from.value.y,
		})
	})

	const dragState = computed(() => {
		return {
			from: from.value,
			to: to.value,
			dragRect: dragRect.value,
		}
	})

	function endDrag() {
		if (dragging.value) {
			onFinished?.(dragState.value)
		}
		//TODO: Is this safe? Theoretically it means that it will get executed after the DOM resolves all non-async events
		// Schedule clearing so we can respond to our dragState in click
		setTimeout(() => {
			dragEnd.value = null
			dragStart.value = null
		}, 0)
		dragging.value = false
		couldDrag.value = false
	}

	useEventListener(container, "mousedown", (ev: MouseEvent) => {
		if (ev.button != 0) return
		const containerElem = toValue(container)
		if (!containerElem) return

		couldDrag.value = true
		dragStart.value = getInternalMousePos(containerElem, ev)
	})

	useEventListener(
		() => (couldDrag.value ? window : null),
		"mousemove",
		(ev: MouseEvent) => {
			const containerElem = toValue(container)
			if (!containerElem) return

			if (!dragging.value) {
				onStart?.(dragState.value)
			}

			dragging.value = true
			dragEnd.value = getInternalMousePos(containerElem, ev)
			onUpdate?.(dragState.value)
		}
	)

	useEventListener(
		() => (couldDrag.value ? window : null),
		"mouseup",
		(ev: MouseEvent) => {
			endDrag()
		}
	)

	return dragState
}

export function getElementRelativeRect(elem: HTMLElement, container: HTMLElement) {
	//TODO: Account for multiple scrolls
	//TODO: Scale?
	//TODO: PanState?
	const scroll = getElementScroll(container)

	const containerRect = container.getBoundingClientRect()
	const elemRect = elem.getBoundingClientRect()

	return DOMRect.fromRect({
		x: elemRect.x - containerRect.x + scroll.x,
		y: elemRect.y - containerRect.y + scroll.y,
		width: elemRect.width,
		height: elemRect.height,
	})
}

export function stopPropagation(ev: { stopPropagation(): any }) {
	ev.stopPropagation()
}

export function stopEvent(ev: { stopPropagation(): any; preventDefault(): any }) {
	ev.stopPropagation()
	ev.preventDefault()
}

export type DOMAttachable = "body" | "self" | string | undefined | HTMLElement

export function provideScrollAttachable(elem: MaybeRefOrGetter<DOMAttachable>) {
	provide(
		"scrollAttachable",
		computed(() => toValue(elem))
	)
}

export function injectScrollAttachable(defaultAttach?: MaybeRefOrGetter<DOMAttachable>) {
	return inject<ComputedRef<DOMAttachable>>(
		"scrollAttachable",
		computed(() => {
			if (defaultAttach != null) {
				return toValue(defaultAttach)
			}
			return "body"
		})
	)
}

export function positionPortal(
	element: HTMLElement | undefined | null,
	target: HTMLElement | undefined | null,
	attachTo: HTMLElement | undefined | null | string
) {
	if (!element || !target || !attachTo) return

	if (attachTo == "body") {
		DomHandler.absolutePosition(element, target)
		return
	} else if (attachTo == "self") {
		DomHandler.relativePosition(element, target)
		return
	} else if (typeof attachTo == "string") {
		return
	}

	const targetRect = getElementRelativeRect(target, attachTo)
	const targetBounds = target.getBoundingClientRect()

	const elemRect = element.getBoundingClientRect()

	let left = 0
	let top = 0

	const attachBounds = attachTo.getBoundingClientRect()
	//const viewport = { width: window.innerWidth, height: window.innerHeight }

	left = targetRect.left
	top = targetRect.bottom

	const clientBottom = targetBounds.bottom + elemRect.height
	//Something with the transition animation ruins this.
	/*if (viewportBottom >= viewport.height) {
		//Try the top

		top = targetRect.top - elemRect.height
		element.style.top = `${top}px`
	} else {*/
	element.style.top = `${top}px`
	//}

	const clientRight = targetBounds.left + elemRect.width
	if (clientRight >= attachBounds.right) {
		//const overlap = clientRight - attachBounds.right
		//console.log("RIGHT", viewport.width, viewportRight, elemRect.width, left, overlap, left - overlap)
		left = targetRect.right - elemRect.width
	}

	element.style.left = `${left}px`
}
