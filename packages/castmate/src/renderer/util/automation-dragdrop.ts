import { SequenceActions } from "./../../../../../libs/castmate-schema/src/types/sequence"
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
import {
	DragEventWithDataTransfer,
	getInternalMousePos,
	injectSelectionState,
	isChildOfClass,
	useDragEnter,
	useDragLeave,
	useDragOver,
	useDrop,
} from "castmate-ui-core"

export interface DropZone {
	get key(): string
	inZone(ev: MouseEvent): boolean
	computeDistance(ev: MouseEvent): number
	doDrop(sequence: Sequence, ev: MouseEvent): void
	instanceId: string
}

export function pickUpAutomation(id: string, seq: Sequence) {}

export interface AutomationEditState {
	dragging: Ref<boolean>
	dropCandidate: Ref<string | null>
	getZone(ev: MouseEvent): DropZone | undefined
	registerDropZone(key: string, zone: DropZone): void
	unregisterDropZone(key: string, zone: DropZone): void
}

export function provideAutomationEditState(
	automationElem: MaybeRefOrGetter<HTMLElement | null>,
	createFloatingSequence: (seq: SequenceActions, pos: MouseEvent) => any
): AutomationEditState {
	const defaultDistance = 100000
	const dragging = ref<boolean>(false)
	const dropCandidate = shallowRef<string | null>(null)
	const dropCandidateDistance = ref<number>(defaultDistance)

	const dropZones = ref<Record<string, DropZone[]>>({})

	function collectDropZones(ev: MouseEvent) {
		const result = []
		for (let [key, zones] of Object.entries(dropZones.value)) {
			//Zones is an array to work around the ordering of drop and dragend events causing the unregistration of newly registered zones
			const zone = zones[0] //We should only care about the first one

			if (zones.length > 1) {
				console.log("Dupe Zones", key, [...zones])
				console.log(zones[0] == zones[1])
				console.log(zones[0] === zones[1])
			}

			if (zone.inZone(ev)) {
				result.push(zone)
			}
		}
		return result
	}

	const automationEditState = {
		dragging,
		dropCandidate,
		dropZones,
		registerDropZone(key: string, zone: DropZone) {
			if (key in dropZones.value) {
				dropZones.value[key].push(zone)
			} else {
				dropZones.value[key] = [zone]
			}
		},
		unregisterDropZone(key: string, zone: DropZone) {
			if (!dropZones.value[key]) return

			const zones = dropZones.value[key]
			if (!zones) return //wtf?

			const idx = zones.findIndex((dz) => dz.instanceId === zone.instanceId)
			if (idx == -1) {
				console.error("Unable to unregister", key, zone.instanceId)
				console.error(
					"instances",
					zones.map((z) => z.instanceId)
				)
			}
			zones.splice(idx, 1)

			if (zones.length == 0) {
				delete dropZones.value[key]
			} else {
			}
		},
		getZone(ev: MouseEvent) {
			const overlapZones = collectDropZones(ev)

			//console.log("Zones", overlapZones.length, "/", dropZones.value.size)

			let minZone: DropZone | undefined
			let minZoneDistance: number = 100000

			for (let zone of overlapZones) {
				const d = zone.computeDistance(ev)
				if (d < minZoneDistance) {
					minZone = zone
					minZoneDistance = d
				}
			}

			return minZone
		},
	}

	//We put drag handlers on the root editor since HTML5 doesn't track multiple overlaps.
	useDragOver(automationElem, "automation-sequence", (ev: DragEventWithDataTransfer) => {
		let minZone = automationEditState.getZone(ev)

		dropCandidate.value = minZone?.key ?? null

		if (ev.dataTransfer.effectAllowed == "move") ev.dataTransfer.dropEffect = "move"
		if (ev.dataTransfer.effectAllowed == "copy") ev.dataTransfer.dropEffect = "copy"
	})

	useDragEnter(automationElem, "automation-sequence", (ev: DragEventWithDataTransfer) => {
		automationEditState.dragging.value = true
	})

	useDragLeave(automationElem, "automation-sequence", (ev: DragEventWithDataTransfer) => {
		automationEditState.dragging.value = false
	})

	useDrop(automationElem, "automation-sequence", (ev: DragEventWithDataTransfer) => {
		automationEditState.dragging.value = false

		const data: Sequence = JSON.parse(ev.dataTransfer.getData("automation-sequence"))

		const dropZone = automationEditState.getZone(ev)

		if (dropZone) {
			dropZone.doDrop(data, ev)
		} else {
			//Create new floating sequence
			createFloatingSequence(data, ev)
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
	const parentDragging = inject<ComputedRef<boolean>>(
		"sequenceDragging",
		computed(() => false)
	)

	const selectionState = injectSelectionState()

	const childDragging = computed(() => parentDragging?.value || dragging.value)
	provide("sequenceDragging", childDragging)

	const automationEditState = useAutomationEditState()

	useEventListener(element, "mousedown", (ev: MouseEvent) => {
		dragTarget.value = ev.target as HTMLElement
		if (isChildOfClass(dragTarget.value, "action-handle")) {
			ev.stopPropagation()
		}
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

		//Unfortunately we can't use propagation to stop the selection rect from happening here.
		selectionState.cancelSelection()

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
