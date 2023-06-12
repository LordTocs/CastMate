<template>
	<div
		class="divider"
		:class="{ horizontal: props.horizontal, vertical: !props.horizontal }"
		@mousedown="onMouseDown"
	></div>
</template>

<script setup lang="ts">
import { useEventListener } from "@vueuse/core"
import { ref } from "vue"

const props = defineProps({
	horizontal: { type: Boolean, default: false },
})

const grabbed = ref<boolean>(false)

function onMouseDown(ev) {
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
	height: 10px;
	width: 100%;
	cursor: row-resize;
}

.vertical {
	width: 10px;
	height: 100%;
	cursor: col-resize;
}
</style>
