import {
	ActionStack,
	AnyAction,
	FloatingSequence,
	FlowAction,
	SequenceActions,
	TimeAction,
	assignNewIds,
	isActionStack,
	isFlowAction,
	isInstantAction,
	isTimeAction,
} from "castmate-schema"
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
	ClientPosition,
	DragEventWithDataTransfer,
	getInternalMousePos,
	injectSelectionState,
	isChildOfClass,
	useDragEnter,
	useDragLeave,
	useDragOver,
	useDrop,
	SelectionPos,
	Selection,
	useCommitUndo,
	useDelayedCommitUndo,
	DataBinding,
	useBaseDataBinding,
} from "../main"
import { nanoid } from "nanoid/non-secure"
import _cloneDeep from "lodash/cloneDeep"
import { automationTimeScale } from "../components/automation/automation-shared"

export interface SelectionGetter {
	getSelectedItems(container: HTMLElement, from: SelectionPos, to: SelectionPos): Selection
	deleteIds(ids: string[]): boolean
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
	createFloatingSequence(sequence: Sequence, position: ClientPosition): void
}

interface LocalDragHandler {
	dragging: boolean
	removeSequence: null | (() => void)
	dropped: boolean
}

export function provideAutomationEditState(
	automationElem: MaybeRefOrGetter<HTMLElement | null>,
	createFloatingSequence: (seq: SequenceActions, offset: { x: number; y: number }, pos: ClientPosition) => any
): AutomationEditState {
	const defaultDistance = 100000
	const dragging = ref<boolean>(false)
	const dropCandidate = shallowRef<string | null>(null)
	const dropCandidateDistance = ref<number>(defaultDistance)

	//const commitUndo = useCommitUndo()
	//Commits to undo, but does it on the next vue tick. Two calls before the next tick don't duplicate commit
	const commitUndo = useCommitUndo()
	const dataBinding = useBaseDataBinding()

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
		createFloatingSequence(sequence: Sequence, position: ClientPosition) {
			createFloatingSequence(sequence, { x: 0, y: 0 }, position)
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

		let needsUndoCommit = false

		const sourceDataBinding = ev.dataTransfer.getData("data-binding-id")

		//Use effectAllowed since for whatever reason dropEffect is always "none" (Probably chrome bug)
		if (sequenceLocalDrag.value.dragging && ev.dataTransfer.effectAllowed == "move") {
			console.log("Dropped Locally")
			sequenceLocalDrag.value.dropped = true
			//Local drop, we do removal here to avoid the v-model blowing up the element holding our dragend event.
			sequenceLocalDrag.value.removeSequence?.()
			needsUndoCommit = true
		} else {
			console.log("Dropped from Remote")
			//Because of undo being document local, remote drops must always assign new Ids
			assignNewIds(data)
			sequenceLocalDrag.value.dropped = false
			if (sourceDataBinding != dataBinding.id || ev.dataTransfer.dropEffect == "copy") {
				console.log("needsUndo remote", sourceDataBinding, dataBinding.id, ev.dataTransfer.dropEffect)
				//This is dropped from a remote automation AND from a different tab so we commit undo here
				//If it's droped from the same tab but a remote automation it will commit in dragend
				needsUndoCommit = true
			}
		}
		const offset: { x: number; y: number } = JSON.parse(ev.dataTransfer.getData("automation-drag-offset"))

		if (dropZone) {
			dropZone.doDrop(data, ev, offset)
		} else {
			//Create new floating sequence
			createFloatingSequence(data, offset, ev)
		}

		if (needsUndoCommit) {
			console.log("Commiting Undo From Drop")
			commitUndo()
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

	const dataBinding = useBaseDataBinding()
	const commitUndo = useCommitUndo()

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
		if (ev.altKey) {
			//We're copying, always assign new ids
			assignNewIds(sequence)
		}
		ev.dataTransfer.setData("automation-sequence", JSON.stringify(sequence))
		ev.dataTransfer.setData("data-binding-id", dataBinding.id)

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

		if (ev.dataTransfer.dropEffect == "none") {
		} else if (ev.dataTransfer.dropEffect == "copy") {
		} else if (ev.dataTransfer.dropEffect == "move") {
			if (!sequenceLocalDrag.value.dropped) {
				console.log("Removing Sequence in End")
				//Pop the data now.
				removeSequence()
			}
			console.log("Commiting Undo dragend")
			commitUndo()
		}

		sequenceLocalDrag.value.dragging = false
		sequenceLocalDrag.value.dropped = false
		sequenceLocalDrag.value.removeSequence = null

		dragging.value = false
		ev.stopPropagation()
	})

	return { dragging: computed(() => dragging.value), draggingDelayed: computed(() => draggingDelayed.value) }
}

interface ActionCopyResult {
	connected: boolean
	subSeqs: FloatingSequence[]
}

function cloneAction<T extends AnyAction>(action: T): T {
	if (isInstantAction(action)) {
		return _cloneDeep({
			...action,
			id: nanoid(),
		})
	} else if (isTimeAction(action)) {
		return _cloneDeep({
			...action,
			id: nanoid(),
			offsets: [],
		})
	} else if (isFlowAction(action)) {
		return _cloneDeep({
			...action,
			id: nanoid(),
			subFlows: action.subFlows.map((s) => _cloneDeep({ ...s, actions: [] })),
		})
	}

	throw new Error("Unknown Action Type!")
}

const automationHeight = 40

export function copyActionData(
	action: AnyAction | ActionStack,
	selectedIds: string[],
	workingPos: SelectionPos
): ActionCopyResult | undefined {
	if (isInstantAction(action)) {
		if (selectedIds.includes(action.id)) {
			//Copy this one!
			return {
				connected: true,
				subSeqs: [
					{
						actions: [cloneAction(action)],
						x: workingPos.x,
						y: workingPos.y,
						id: nanoid(),
					},
				],
			}
		}

		workingPos.x += 1 / automationTimeScale //TODO: How wide is an action????

		return undefined
	} else if (isTimeAction(action)) {
		if (selectedIds.includes(action.id)) {
			const copyAction: TimeAction = cloneAction(action)
			const result: ActionCopyResult = {
				connected: true,
				subSeqs: [
					{
						id: nanoid(),
						x: workingPos.x,
						y: workingPos.y,
						actions: [copyAction],
					},
				],
			}

			for (const offsetSeq of action.offsets) {
				const offsetWorkingPos: SelectionPos = {
					x: workingPos.x + offsetSeq.offset / automationTimeScale,
					y: workingPos.y + automationHeight,
				}

				const copyData = copySequenceData(offsetSeq, selectedIds, offsetWorkingPos)
				if (copyData) {
					if (copyData.connected) {
						copyAction.offsets.push({
							id: nanoid(),
							offset: offsetSeq.offset,
							actions: copyData.subSeqs[0].actions,
						})

						copyData.subSeqs.splice(0, 1)
					}

					result.subSeqs.push(...copyData.subSeqs)
				}
			}

			workingPos.x += 1 / automationTimeScale //TODO: What's the duration??

			return result
		} else {
			const result: ActionCopyResult = {
				connected: false,
				subSeqs: [],
			}

			for (const offsetSeq of action.offsets) {
				const offsetWorkingPos: SelectionPos = {
					x: workingPos.x + offsetSeq.offset / automationTimeScale,
					y: workingPos.y + automationHeight,
				}

				const copyData = copySequenceData(offsetSeq, selectedIds, offsetWorkingPos)
				if (copyData) {
					result.subSeqs.push(...copyData.subSeqs)
				}
			}

			workingPos.x += 1 / automationTimeScale //TODO: What's the duration??

			if (result.subSeqs.length > 0) {
				return result
			}
			return undefined
		}
	} else if (isFlowAction(action)) {
		if (selectedIds.includes(action.id)) {
			const copyAction: FlowAction = cloneAction(action)

			const result: ActionCopyResult = {
				connected: true,
				subSeqs: [
					{
						id: nanoid(),
						x: workingPos.x,
						y: workingPos.y,
						actions: [copyAction],
					},
				],
			}

			for (let i = 0; i < action.subFlows.length; ++i) {
				const subFlow = action.subFlows[i]

				const subFlowPos: SelectionPos = {
					x: workingPos.x, //Todo: x padding?
					y: workingPos.y + (i + 1) * automationHeight, //Todo: Calculate depth
				}

				const copyData = copySequenceData(subFlow, selectedIds, subFlowPos)
				if (!copyData) continue

				if (copyData.connected) {
					copyAction.subFlows[i].actions.push(...copyData.subSeqs[0].actions)
					copyData.subSeqs.splice(0, 1)
				}

				result.subSeqs.push(...copyData.subSeqs)
			}

			workingPos.x += 1 / automationTimeScale //TODO: What's the duration??
			return result
		} else {
			const result: ActionCopyResult = {
				connected: false,
				subSeqs: [],
			}

			for (let i = 0; i < action.subFlows.length; ++i) {
				const subFlow = action.subFlows[i]

				const subFlowPos: SelectionPos = {
					x: workingPos.x, //Todo: x padding?
					y: workingPos.y + (i + 1) * automationHeight, //Todo: Calculate depth
				}

				const copyData = copySequenceData(subFlow, selectedIds, subFlowPos)

				if (copyData) result.subSeqs.push(...copyData.subSeqs)
			}

			workingPos.x += 1 / automationTimeScale //TODO: What's the duration??

			if (result.subSeqs.length > 0) {
				return result
			}
			return undefined
		}
	} else if (isActionStack(action)) {
		const result: ActionCopyResult = {
			connected: false,
			subSeqs: [],
		}

		let lastSelected: ActionStack | undefined = undefined

		for (let i = 0; i < action.stack.length; ++i) {
			const stackAction = action.stack[i]

			if (selectedIds.includes(stackAction.id)) {
				if (!lastSelected) {
					//Create new sequence
					lastSelected = {
						id: nanoid(),
						stack: [],
					}

					result.subSeqs.push({
						id: nanoid(),
						x: workingPos.x,
						y: workingPos.y + i * automationHeight,
						actions: [lastSelected],
					})

					if (i == 0) {
						result.connected = true
					}
				}

				lastSelected.stack.push(cloneAction(stackAction))
			} else {
				lastSelected = undefined
			}
		}

		//Convert any single action stacks into just their action
		for (let i = 0; i < result.subSeqs.length; ++i) {
			const seq = result.subSeqs[i]

			const stack = seq.actions[0] as ActionStack

			if (stack.stack.length == 1) {
				result.subSeqs[i].actions[0] = stack.stack[0]
			}
		}

		workingPos.x += 1 / automationTimeScale //TODO: What's the duration??

		if (result.subSeqs.length > 0) {
			return result
		}
		return undefined
	}

	return undefined
}

export function copySequenceData(
	sequence: Sequence | FloatingSequence,
	selectedIds: string[],
	workingPos: SelectionPos
): ActionCopyResult | undefined {
	const result: ActionCopyResult = {
		connected: false,
		subSeqs: [],
	}

	let lastSelected: FloatingSequence | undefined = undefined
	for (let i = 0; i < sequence.actions.length; ++i) {
		const action = sequence.actions[i]

		const copyData = copyActionData(action, selectedIds, workingPos)

		if (!copyData) {
			lastSelected = undefined
			continue
		}

		if (copyData.connected) {
			if (!lastSelected) {
				result.subSeqs.push({
					id: nanoid(),
					x: copyData.subSeqs[0].x,
					y: copyData.subSeqs[0].y,
					actions: [],
				})

				if (i == 0) {
					result.connected = true
				}
			}

			result.subSeqs[result.subSeqs.length - 1].actions.push(...copyData.subSeqs[0].actions)

			copyData.subSeqs.splice(0, 1)
			lastSelected = result.subSeqs[result.subSeqs.length - 1]
		} else {
			lastSelected = undefined
		}

		result.subSeqs.push(...copyData.subSeqs)
	}

	if (result.subSeqs.length > 0) {
		return result
	}

	return undefined
}
