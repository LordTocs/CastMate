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
	computed,
	ComputedRef,
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
			const overlapZones = collectDropZones(ev)

			//console.log("Zones", overlapZones.length, "/", dropZones.value.size)

			let minZone: DropZone | undefined
			let minZoneDistance: number = 100000

			for (let zone of overlapZones) {
				const d = zone.computeDistance(ev)
				//console.log(zone.key, d)
				if (d < minZoneDistance) {
					minZone = zone
					minZoneDistance = d
				}
			}

			return minZone
		},
	}

	useEventListener(automationElem, "dragover", (ev: DragEvent) => {
		if (!ev.dataTransfer) return
		if (!ev.dataTransfer.types.includes("automation-sequence")) return

		const rootElem = toValue(automationElem)
		if (!rootElem) return

		let minZone = automationEditState.getZone(ev)

		dropCandidate.value = minZone?.key ?? null

		if (ev.dataTransfer.effectAllowed == "move") ev.dataTransfer.dropEffect = "move"
		if (ev.dataTransfer.effectAllowed == "copy") ev.dataTransfer.dropEffect = "copy"

		ev.preventDefault()
		ev.stopPropagation()
	})

	interface FromTo {
		fromElement?: HTMLElement
		toElement?: HTMLElement
	}

	useEventListener(automationElem, "dragenter", (ev: DragEvent) => {
		if (!ev.dataTransfer) return
		if (!ev.dataTransfer.types.includes("automation-sequence")) return

		const ft = ev as FromTo

		if (ft.toElement && !toValue(automationElem)?.contains(ft.toElement)) {
			return
		}

		automationEditState.dragging.value = true
		ev.preventDefault()
		ev.stopPropagation()
	})

	useEventListener(automationElem, "dragleave", (ev: DragEvent) => {
		if (!ev.dataTransfer) return
		if (!ev.dataTransfer.types.includes("automation-sequence")) return

		const ft = ev as FromTo

		if (ft.fromElement && toValue(automationElem)?.contains(ft.fromElement)) {
			return
		}

		automationEditState.dragging.value = false
		ev.preventDefault()
		ev.stopPropagation()
	})

	useEventListener(automationElem, "drop", (ev: DragEvent) => {
		if (!ev.dataTransfer) return
		if (!ev.dataTransfer.types.includes("automation-sequence")) return

		automationEditState.dragging.value = false
		ev.preventDefault()
		ev.stopPropagation()

		const data: Sequence = JSON.parse(ev.dataTransfer.getData("automation-sequence"))

		const dropZone = automationEditState.getZone(ev)

		if (dropZone) {
			nextTick(() => {
				console.log("Dropping in", dropZone.key)
			})

			dropZone.doDrop()
		} else {
			//Create new floating sequence
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
	const parentDragging = inject<ComputedRef<boolean>>("sequenceDragging")

	const childDragging = computed(() => parentDragging?.value || dragging.value)
	provide("sequenceDragging", childDragging)

	const automationEditState = useAutomationEditState()

	console.log("Using Sequence Drag")

	useEventListener(element, "mousedown", (ev: MouseEvent) => {
		dragTarget.value = ev.target as HTMLElement
	})

	useEventListener(element, "dragstart", (ev: DragEvent) => {
		if (!ev.target) return
		if (!ev.dataTransfer) return
		if (!automationEditState) return

		if (!dragTarget.value || !isChildOfClass(dragTarget.value, "action-handle")) {
			ev.preventDefault() //Don't start dragging if we're not in the action-handle
			ev.stopPropagation()
			return
		}

		console.log("DragStart", toValue(element)?.className)

		//Grab data here
		const sequence = sequenceCloner()
		ev.dataTransfer.effectAllowed = ev.altKey ? "copy" : "move"
		ev.dataTransfer.setData("automation-sequence", JSON.stringify(sequence))

		dragging.value = true
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
		ev.stopPropagation()
	})

	return { dragging: computed(() => dragging.value) }
}
