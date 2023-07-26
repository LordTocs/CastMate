import { Sequence } from "castmate-schema"
import {
	MaybeRefOrGetter,
	nextTick,
	ref,
	Ref,
	shallowRef,
	inject,
	provide,
	VueElement,
	getCurrentInstance,
	toValue,
} from "vue"

import { useEventListener } from "@vueuse/core"
import { isChildOfClass } from "castmate-ui-core"

export interface DropZone {
	get key(): string
	inZone(ev: MouseEvent): boolean
	computeDistance(ev: MouseEvent): number
	doDrop(): void
}

export function pickUpAutomation(id: string, seq: Sequence) {}

export interface AutomationEditState {
	dragging: Ref<boolean>
	dropCandidate: Ref<string | null>
	getZone(ev: MouseEvent): DropZone | undefined
	registerDropZone(key: string, zone: DropZone): void
	unregisterDropZone(key: string): void
}

function blowUpRect(rect: DOMRect) {
	return DOMRect.fromRect({
		x: rect.x - 60,
		y: rect.y,
		width: rect.width + 120,
		height: rect.height + 60,
	})
}

function inRect(ev: { clientX: number; clientY: number }, rect: DOMRect) {
	if (rect.left > ev.clientX || rect.right < ev.clientX || rect.top > ev.clientY || rect.bottom < ev.clientY) {
		return false
	}
	return true
}

export function useRootAutomationEditState(automationElem: MaybeRefOrGetter<HTMLElement | null>): AutomationEditState {
	const defaultDistance = 100000
	const dragging = ref<boolean>(false)
	const dropCandidate = shallowRef<string | null>(null)
	const dropCandidateDistance = ref<number>(defaultDistance)

	const dropZones = ref<Map<string, DropZone>>(new Map())

	function collectDropZones(ev: MouseEvent) {
		const result = []
		for (let [key, zone] of dropZones.value.entries()) {
			if (zone.inZone(ev)) {
				result.push(zone)
			}
		}
		return result
	}

	const automationEditState = {
		dragging,
		dropCandidate,
		registerDropZone(key: string, zone: DropZone) {
			dropZones.value.set(key, zone)
		},
		unregisterDropZone(key: string) {
			dropZones.value.delete(key)
		},
		getZone(ev: MouseEvent) {
			const dropZones = collectDropZones(ev)

			let minZone: DropZone | undefined
			let minZoneDistance: number = 100000

			for (let zone of dropZones) {
				const d = zone.computeDistance(ev)
				console.log(zone.key, d)
				if (d < minZoneDistance) {
					minZone = zone
					minZoneDistance = d
				}
			}

			return minZone
		},
	}

	useEventListener(automationElem, "dragover", (ev: DragEvent) => {
		const rootElem = toValue(automationElem)
		if (rootElem) {
			let minZone = automationEditState.getZone(ev)

			if (minZone) {
				dropCandidate.value = minZone.key
			}
		}
	})

	provide("automationEditState", automationEditState)

	return automationEditState
}

export function useAutomationEditState() {
	return inject<AutomationEditState>("automationEditState")
}

export function useSequenceDrag(
	element: MaybeRefOrGetter<HTMLElement | null>,
	sequenceCloner: () => Sequence,
	removeSequence: () => void
) {
	const dragTarget = shallowRef<HTMLElement | null>(null)

	const dragging = ref<boolean>(false)

	const automationEditState = useAutomationEditState()

	console.log("Using Sequence Drag")

	useEventListener(element, "mousedown", (ev: MouseEvent) => {
		dragTarget.value = ev.target as HTMLElement
		if (isChildOfClass(dragTarget.value, "action-handle")) {
			console.log("In Handle")
		}
	})

	useEventListener(element, "dragstart", (ev: DragEvent) => {
		console.log("DragStart", (ev.target as HTMLElement).className)

		if (!ev.target) return
		if (!ev.dataTransfer) return
		if (!automationEditState) return

		if (!dragTarget.value || !isChildOfClass(dragTarget.value, "action-handle")) {
			ev.preventDefault() //Don't start dragging if we're not in the action-handle
			ev.stopPropagation()
			return
		}

		//Grab data here
		const sequence = sequenceCloner()
		ev.dataTransfer.effectAllowed = ev.altKey ? "copy" : "move"
		ev.dataTransfer.setData("automation-sequence", JSON.stringify(sequence))
		console.log("Dragging", sequence)

		dragging.value = true

		automationEditState.dragging.value = true
		ev.stopPropagation()
	})

	useEventListener(element, "dragend", (ev: DragEvent) => {
		console.log("DragEnd")

		if (!ev.target) return
		if (!ev.dataTransfer) return
		if (!automationEditState) return

		if (ev.dataTransfer.dropEffect == "none") {
		} else if (ev.dataTransfer.dropEffect == "copy") {
		} else if (ev.dataTransfer.dropEffect == "move") {
			//Pop the data now.
			removeSequence?.()
		}

		dragging.value = false
		automationEditState.dragging.value = false
		ev.stopPropagation()
	})

	return { dragging }
}
