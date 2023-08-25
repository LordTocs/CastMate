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

export function getInternalMousePos(elem: HTMLElement, ev: MouseEvent) {
	const rect = elem.getBoundingClientRect()
	const scroll = getElementScroll(elem)

	return { x: ev.clientX - rect.x + scroll.x, y: ev.clientY - rect.y + scroll.y }
}

export function rectangleOverlaps(r1: DOMRect, r2: DOMRect) {
	return r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top
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
