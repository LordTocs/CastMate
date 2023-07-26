<template>
	<div
		class="drop-zone"
		:class="{ 'target-zone': automationEditState?.dropCandidate.value == dropKey }"
		ref="dropZone"
		v-if="automationEditState?.dragging?.value"
	></div>
</template>

<script setup lang="ts">
import { VueElement, getCurrentInstance, onMounted, onUnmounted, ref } from "vue"
import { useAutomationEditState } from "../../util/automation-dragdrop"
import { useEventListener } from "@vueuse/core"

const props = defineProps<{
	dropKey: string
	dropAxis: "horizontal" | "vertical"
	dropLocation: "start" | "middle"
}>()

const automationEditState = useAutomationEditState()

const dropZone = ref<HTMLElement | null>(null)

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

onMounted(() => {
	automationEditState?.registerDropZone(props.dropKey, {
		computeDistance(ev) {
			return computeDropDistance(computeOffset(ev))
		},
		doDrop() {},
		inZone(ev) {
			if (!dropZone.value) return false
			const rect = dropZone.value.getBoundingClientRect()
			return inRect(ev, rect)
		},
		get key() {
			return props.dropKey
		},
	})
})

onUnmounted(() => {
	automationEditState?.unregisterDropZone(props.dropKey)
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
