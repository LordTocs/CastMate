<template>
	<div class="offset-sequence" :style="{ '--time': modelValue.offset }">
		<div
			class="time-slider"
			ref="slider"
			:class="{ dragging }"
			:style="{ ...firstActionStyle }"
			@mousedown="onMouseDown"
		></div>
		<div class="offset-actions">
			<sequence-actions-edit v-model="modelObj" @self-destruct="selfDestruct" ref="sequenceEdit" />
		</div>
	</div>
</template>

<script setup lang="ts">
import SequenceActionsEdit from "./SequenceActionsEdit.vue"
import { MaybeRefOrGetter, computed, toValue, useModel, ref, type Ref, inject } from "vue"
import { type OffsetActions } from "castmate-schema"
import { SequenceActions } from "castmate-schema"
import { isActionStack } from "castmate-schema"
import { usePluginStore, useColors, usePanState } from "castmate-ui-core"
import { useEventListener } from "@vueuse/core"
import _clamp from "lodash/clamp"
import { TimeActionInfo } from "castmate-schema"
import { Selection, SelectionPos } from "castmate-ui-core"
import { SelectionGetter } from "../../util/automation-dragdrop"

const props = defineProps<{
	modelValue: OffsetActions
}>()
const modelObj = useModel(props, "modelValue")

const emit = defineEmits(["selfDestruct"])
function selfDestruct() {
	emit("selfDestruct")
}

function useFirstAction(sequence: MaybeRefOrGetter<SequenceActions>) {
	const pluginStore = usePluginStore()

	return computed(() => {
		const seq = toValue(sequence)

		if (seq.actions.length == 0) {
			return undefined
		}

		if (isActionStack(seq.actions[0])) {
			if (seq.actions[0].stack.length == 0) return undefined

			const action = seq.actions[0].stack[0]

			return pluginStore.pluginMap.get(action.plugin)?.actions?.[action.action]
		} else {
			return pluginStore.pluginMap.get(seq.actions[0].plugin)?.actions?.[seq.actions[0].action]
		}
	})
}

const firstAction = useFirstAction(() => props.modelValue)
const {
	color: actionColor,
	darkerColor: darkerActionColor,
	darkestColor: darkestActionColor,
	lighterColor: lighterActionColor,
} = useColors(firstAction)

const firstActionStyle = computed(() => ({
	"--action-color": actionColor.value,
	"--darker-action-color": darkerActionColor.value,
	"--darkest-action-color": darkestActionColor.value,
	"--lighter-action-color": lighterActionColor.value,
}))

const dragging = ref(false)
const dragOffset = ref(0)
const actionElement = inject<Ref<HTMLElement | null>>("actionElement")
const slider = ref<HTMLElement | null>(null)
const panState = usePanState()
const timeInfo = inject<Ref<TimeActionInfo>>("timeInfo")

function onMouseDown(ev: MouseEvent) {
	if (ev.button == 0) {
		dragging.value = true
		const offset = computeOffset(ev)

		dragOffset.value = offset.x

		//console.log("Offset", offset)
		ev.preventDefault()
		ev.stopPropagation()
	}
}

function computePos(ev: MouseEvent) {
	if (!actionElement?.value) {
		return { x: 0, y: 0 }
	}

	const rect = actionElement.value.getBoundingClientRect()

	const x = ev.clientX - rect.left
	const y = ev.clientY - rect.top

	return { x, y }
}

function computeOffset(ev: MouseEvent) {
	if (!slider?.value) {
		return { x: 0, y: 0 }
	}

	const rect = slider.value.getBoundingClientRect()

	const x = ev.clientX - rect.left
	const y = ev.clientY - rect.bottom

	return { x, y }
}

function adjustPos(ev: MouseEvent) {
	if (!timeInfo) {
		return
	}
	const pos = computePos(ev)
	const posDiff = pos.x - dragOffset.value
	let time = posDiff / ((panState?.value.zoomX ?? 1) * 40)

	time = _clamp(time, timeInfo.value.minLength, timeInfo.value.duration)

	//console.log("Adjust", time)

	modelObj.value.offset = time
}

useEventListener(window, "mousemove", (ev: MouseEvent) => {
	if (!dragging.value) {
		return
	}

	adjustPos(ev)
})

useEventListener(window, "mouseup", (ev: MouseEvent) => {
	if (ev.button == 0 && dragging.value) {
		dragging.value = false
		adjustPos(ev)

		ev.preventDefault()
		ev.stopPropagation()
	}
})

const sequenceEdit = ref<SelectionGetter | null>(null)
defineExpose({
	getSelectedItems(container: HTMLElement, from: SelectionPos, to: SelectionPos): Selection {
		return sequenceEdit.value?.getSelectedItems(container, from, to) ?? []
	},
})
</script>

<style scoped>
.time-slider {
	background-color: var(--lighter-action-color);
	height: calc(var(--time-handle-height) + 2 * var(--border-radius));
	width: calc(3 * var(--time-handle-width));
	cursor: ew-resize;
	pointer-events: auto;

	clip-path: polygon(0% 0%, 100% 100%, 0% 100%);
}

.offset-sequence {
	position: absolute;
	left: calc(var(--time) * var(--time-width));
}

.dragging {
	background-color: white;
}

.offset-actions {
	position: relative;
	top: calc(-2 * var(--border-radius));
}
</style>
