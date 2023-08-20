<template>
	<div
		class="drop-zone"
		:class="{ 'target-zone': automationEditState?.dropCandidate.value == dropKey }"
		ref="dropZone"
		v-if="automationEditState?.dragging?.value && (!isBeingDragged || forceOn)"
	></div>
</template>

<script setup lang="ts">
import { Ref, inject, onMounted, onUnmounted, ref, shallowRef, computed, onBeforeUnmount, nextTick, markRaw } from "vue"
import { useAutomationEditState, type DropZone } from "../../util/automation-dragdrop"
import { Sequence } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import { isInstantAction, isActionStack } from "castmate-schema"

const props = withDefaults(
	defineProps<{
		dropKey: string
		forceOn?: boolean
		dropAxis: "horizontal" | "vertical"
		dropLocation: "start" | "middle"
		isStack?: boolean
	}>(),
	{ forceOn: false, isStack: false }
)

const emit = defineEmits(["automationDrop"])

const automationEditState = useAutomationEditState()

const dropZone = ref<HTMLElement | null>(null)

const isBeingDragged = inject<Ref<boolean>>(
	"sequenceDragging",
	computed(() => false)
)

function computeOffset(ev: MouseEvent) {
	let offset = { x: 0, y: 0, width: 0, height: 0 }

	if (dropZone.value) {
		const rect = dropZone.value.getBoundingClientRect()
		const x = ev.clientX - rect.x
		const y = ev.clientY - rect.y

		offset = { x, y, width: rect.width, height: rect.height }
	}

	return offset
}

function computeDropDistance(offset: { x: number; y: number; width: number; height: number }) {
	const p = offset[props.dropAxis == "vertical" ? "x" : "y"]
	const size = offset[props.dropAxis == "vertical" ? "width" : "height"]

	const t = props.dropLocation == "start" ? 0 : size / 2

	return Math.abs(t - p)
}

function inRect(ev: { clientX: number; clientY: number }, rect: DOMRect) {
	if (rect.left > ev.clientX || rect.right < ev.clientX || rect.top > ev.clientY || rect.bottom < ev.clientY) {
		return false
	}
	return true
}

const zone = ref<DropZone>()

onMounted(() => {
	const instanceId = nanoid()
	//console.log("Mounting", props.dropKey, instanceId)
	zone.value = {
		instanceId,
		computeDistance(ev) {
			return computeDropDistance(computeOffset(ev))
		},
		doDrop(sequence, ev, dragOffset) {
			const mouseOffset = computeOffset(ev)
			emit("automationDrop", sequence, {
				x: mouseOffset.x - dragOffset.x,
				y: mouseOffset.y - dragOffset.y,
				width: mouseOffset.width,
				height: mouseOffset.height,
			})
		},
		inZone(ev) {
			if (!dropZone.value) {
				//console.log("Zone Missing", props.dropKey)
				return false
			}
			const rect = dropZone.value.getBoundingClientRect()
			return inRect(ev, rect)
		},
		canDrop(ev) {
			if (props.isStack) {
				return ev.dataTransfer.types.includes("automation-sequence-stackable")
			}
			return true
		},
		get key() {
			return props.dropKey
		},
	}
	automationEditState?.registerDropZone(props.dropKey, zone.value)
})

onBeforeUnmount(() => {
	//console.log("Unmounting", props.dropKey, zone.value?.instanceId)
	if (!zone.value) return
	automationEditState?.unregisterDropZone(props.dropKey, zone.value)
})
</script>

<style scoped>
.drop-zone {
	position: absolute;
	background-color: rgba(255, 0, 0, 0.1);
}

.target-zone {
	background-color: rgba(0, 255, 0, 0.1) !important;
}
</style>
