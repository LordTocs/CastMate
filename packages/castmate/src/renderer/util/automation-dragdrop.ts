import { SequenceActions, isActionStack, isInstantAction } from "castmate-schema"
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
	markRaw,
	watch,
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

import { SelectionPos, Selection } from "castmate-ui-core"

export interface SelectionGetter {
	getSelectedItems(container: HTMLElement, from: SelectionPos, to: SelectionPos): Selection
}

export interface DropZone {
	get key(): string
	inZone(ev: MouseEvent): boolean
	computeDistance(ev: MouseEvent): number
	canDrop?(ev: DragEventWithDataTransfer): boolean
	doDrop(sequence: Sequence, ev: MouseEvent, dragOffset: { x: number; y: number }): void
	instanceId: string
}

export function pickUpAutomation(id: string, seq: Sequence) {}

export interface AutomationEditState {
	dragging: Ref<boolean>
	dropCandidate: Ref<string | null>
	getZone(ev: DragEventWithDataTransfer): DropZone | undefined
	registerDropZone(key: string, zone: DropZone): void
	unregisterDropZone(key: string, zone: DropZone): void
}

interface LocalDragHandler {
	dragging: boolean
	removeSequence: null | (() => void)
	dropped: boolean
}

export function provideAutomationEditState(
	automationElem: MaybeRefOrGetter<HTMLElement | null>,
	createFloatingSequence: (seq: SequenceActions, offset: { x: number; y: number }, pos: MouseEvent) => any
): AutomationEditState {
	const defaultDistance = 100000
	const dragging = ref<boolean>(false)
	const dropCandidate = shallowRef<string | null>(null)
	const dropCandidateDistance = ref<number>(defaultDistance)

	const dropZones = ref<Record<string, DropZone[]>>({})
	const sequenceLocalDrag = ref<LocalDragHandler>({ dragging: false, removeSequence: null, dropped: false })
	provide("sequenceLocalDrag", sequenceLocalDrag)

	function collectDropZones(ev: DragEventWithDataTransfer) {
		const result = []
		for (let [key, zones] of Object.entries(dropZones.value)) {
			//Zones is an array to work around the ordering of drop and dragend events causing the unregistration of newly registered zones
			const zone = zones[0] //We should only care about the first one

			if (zones.length > 1) {
				console.log("Dupe Zones", key, [...zones])
				console.log(zones[0] == zones[1])
				console.log(zones[0] === zones[1])
			}

			//console.log(zone.canDrop)

			if (zone.inZone(ev)) {
				if (!zone.canDrop || zone.canDrop(ev)) {
					result.push(zone)
				}
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
		getZone(ev: DragEventWithDataTransfer) {
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

		//Use effectAllowed since for whatever reason dropEffect is always "none" (Probably chrome bug)
		if (sequenceLocalDrag.value.dragging && ev.dataTransfer.effectAllowed == "move") {
			console.log("Dropped Locally")
			sequenceLocalDrag.value.dropped = true
			//Local drop, we do removal here to avoid the v-model blowing up the element holding our dragend event.
			sequenceLocalDrag.value.removeSequence?.()
		} else {
			console.log("Dropped from Remote")
			sequenceLocalDrag.value.dropped = false
		}
		const offset: { x: number; y: number } = JSON.parse(ev.dataTransfer.getData("automation-drag-offset"))

		if (dropZone) {
			dropZone.doDrop(data, ev, offset)
		} else {
			//Create new floating sequence
			createFloatingSequence(data, offset, ev)
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
	const draggingDelayed = ref<boolean>(false)

	watch(dragging, (value) => {
		setTimeout(() => {
			draggingDelayed.value = value
		}, 0)
	})

	const parentDragging = inject<ComputedRef<boolean>>(
		"sequenceDragging",
		computed(() => false)
	)

	const sequenceLocalDrag = inject<Ref<LocalDragHandler>>(
		"sequenceLocalDrag",
		ref({ dragging: false, removeSequence: null, dropped: false })
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
		const elem = toValue(element)
		if (!elem) return

		if (!dragTarget.value || !isChildOfClass(dragTarget.value, "action-handle")) {
			ev.preventDefault() //Don't start dragging if we're not in the action-handle
			ev.stopPropagation()
			return
		}

		//Unfortunately we can't use propagation to stop the selection rect from happening here.
		selectionState.cancelSelection()

		sequenceLocalDrag.value.dragging = true
		sequenceLocalDrag.value.dropped = false
		sequenceLocalDrag.value.removeSequence = markRaw(() => {
			removeSequence()
			dragging.value = false
		})

		console.log("DragStart", toValue(element)?.className)

		//Grab data here
		const sequence = sequenceCloner()
		ev.dataTransfer.effectAllowed = ev.altKey ? "copy" : "move"
		ev.dataTransfer.setData("automation-sequence", JSON.stringify(sequence))

		if (
			sequence.actions.length == 1 &&
			(isActionStack(sequence.actions[0]) || isInstantAction(sequence.actions[0]))
		) {
			//Hover events cant inspect the contents of data. So we have to add a special piece of data to act as a flag.
			//We only set this flag if this can be put on an action stack. (It's a stack or a single instant action)
			ev.dataTransfer.setData("automation-sequence-stackable", "true")
		}

		const offset = getInternalMousePos(elem, ev)
		ev.dataTransfer.setData("automation-drag-offset", JSON.stringify(offset))

		dragging.value = true
		ev.stopPropagation()
	})

	useEventListener(element, "dragend", (ev: DragEvent) => {
		if (!ev.target) return
		if (!ev.dataTransfer) return
		if (!automationEditState) return

		console.log("DragEnd", ev.dataTransfer.dropEffect)

		if (ev.dataTransfer.dropEffect == "none") {
		} else if (ev.dataTransfer.dropEffect == "copy") {
		} else if (ev.dataTransfer.dropEffect == "move") {
			console.log(sequenceLocalDrag.value)
			if (!sequenceLocalDrag.value.dropped) {
				console.log("Removing Sequence in End")
				//Pop the data now.
				removeSequence()
			}
		}

		sequenceLocalDrag.value.dragging = false
		sequenceLocalDrag.value.dropped = false
		sequenceLocalDrag.value.removeSequence = null

		dragging.value = false
		ev.stopPropagation()
	})

	return { dragging: computed(() => dragging.value), draggingDelayed: computed(() => draggingDelayed.value) }
}
