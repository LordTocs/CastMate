<template>
	<div ref="frame">
		<slot></slot>
	</div>
</template>

<script setup>
import { computed, onMounted, provide, ref } from "vue"

const props = defineProps({
	workspaceWidth: { type: Number },
	workspaceHeight: { type: Number },
})

const frame = ref(null)
provide("dragFrame", frame)

const frameWidth = ref(0)

const frameResizeObserver = new ResizeObserver((entries) => {
	for (let entry of entries) {
		//const sizeBox = entry.contentBoxSize[0];
		frameWidth.value = entry.contentRect.width
	}
})

onMounted(() => {
	frameResizeObserver.observe(frame.value)
})

const renderScale = computed(() => {
	return frameWidth.value / props.workspaceWidth
})

defineExpose({
	renderScale,
	frame,
})

provide("renderScale", renderScale)
</script>
