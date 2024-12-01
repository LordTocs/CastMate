<template>
	<div class="divider" :class="{ horizontal, vertical, grabbed }" @mousedown="onMouseDown"></div>
</template>

<script setup lang="ts">
import { useEventListener } from "@vueuse/core"
import { ref, computed } from "vue"

const props = defineProps<{
	direction: "horizontal" | "vertical"
}>()

const grabbed = ref<boolean>(false)

function onMouseDown(ev: MouseEvent) {
	grabbed.value = true
}

useEventListener("mousemove", (ev) => {
	ev.preventDefault()
})

useEventListener("mouseup", (ev) => {
	ev.preventDefault()
	ev.stopPropagation()
	grabbed.value = false
})

const horizontal = computed(() => props.direction == "horizontal")
const vertical = computed(() => props.direction == "vertical")

const clientAxis = computed(() => (props.direction == "horizontal" ? "clientX" : "clientY"))
</script>

<style scoped>
.divider {
	background-color: var(--surface-border);
}

.grabbed {
	background-color: var(--p-primary-color);
}

.vertical {
	height: 3px;
	width: 100%;
	cursor: row-resize;
}

.horizontal {
	width: 3px;
	height: 100%;
	cursor: col-resize;
}
</style>
