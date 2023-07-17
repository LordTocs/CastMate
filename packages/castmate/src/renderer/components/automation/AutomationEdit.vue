<template>
	<div class="edit-area" :style="{ '--zoom-level': `${zoom}` }" ref="editArea" @wheel="onWheel">
		<action-element v-model="test" />
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { type Sequence } from "castmate-schema"
import ActionElement from "./ActionElement.vue"
import { ActionInfo } from "castmate-schema"

const props = defineProps<{
	modelValue: Sequence
}>()

const emit = defineEmits(["update:modelValue"])
const zoom = ref(1)
const editArea = ref<HTMLElement | undefined>(undefined)

const test = ref<ActionInfo>({
	id: "acb",
	plugin: "castmate",
	action: "delay",
	config: {},
})

function onWheel(ev: WheelEvent) {
	if (ev.ctrlKey) {
		console.log(ev.deltaY)
		zoom.value += (ev.deltaY / 100) * 0.08
		ev.preventDefault()
		ev.stopPropagation()
	}
}
</script>

<style scoped>
.edit-area {
	position: relative;

	background-size: calc(var(--zoom-level) * 40px) 40px;
	background-color: var(--surface-a);
	background-image: radial-gradient(circle, var(--surface-d) 1px, rgba(0, 0, 0, 0) 1px);

	height: 100%;
	overflow: hidden;
	--timeline-height: 120px;
}
</style>
