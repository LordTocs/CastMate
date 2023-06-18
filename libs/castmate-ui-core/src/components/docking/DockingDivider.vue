<template>
	<div
		class="divider"
		:class="{ horizontal: direction == 'horizontal', vertical: direction == 'vertical' }"
		@mousedown="onMouseDown"
	></div>
</template>

<script setup lang="ts">
import { useEventListener } from "@vueuse/core"
import { ref } from "vue"

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
</script>

<style scoped>
.divider {
	background-color: red;
}

.horizontal {
	height: 3px;
	width: 100%;
	cursor: row-resize;
}

.vertical {
	width: 3px;
	height: 100%;
	cursor: col-resize;
}
</style>
