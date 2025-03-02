<template>
	<div class="flex flex-row gap-1">
		<div class="slider-label">
			<slot name="label">{{ label }}</slot>
		</div>
		<div
			:style="{ background: gradient }"
			class="flex-grow-1 gradient-slider"
			ref="slider"
			@mousedown="onMouseDown"
		>
			<div
				class="dot"
				:style="{
					left: `calc(${dotPos * 100}% - 5px)`,
					top: `calc(50% - 5px)`,
				}"
			></div>
		</div>
		<p-input-number class="picker-input" v-model="model" :min="min" :max="max" show-buttons size="small" />
	</div>
</template>

<script setup lang="ts">
import { computed, ref, StyleValue } from "vue"
import { stopPropagation, useCommitUndo } from "../../../../main"
import { useEventListener } from "@vueuse/core"
import PInputNumber from "primevue/inputnumber"

const props = withDefaults(
	defineProps<{
		gradient: string
		min?: number
		max?: number
		label?: string
	}>(),
	{
		min: 0,
		max: 1,
	}
)

const slider = ref<HTMLElement>()
const model = defineModel<number>({ required: true })
const dotPos = computed(() => (model.value - props.min) / (props.max - props.min))

const dragging = ref(false)

const commitUndo = useCommitUndo()

function onMouseDown(ev: MouseEvent) {
	if (ev.button == 0) {
		ev.preventDefault()
		stopPropagation(ev)
		dragging.value = true
	}
}

function updateModelWithMouse(ev: MouseEvent) {
	if (!slider.value) return

	const rect = slider.value.getBoundingClientRect()

	const localX = ev.clientX - rect.left
	//const localY = ev.clientY - rect.top

	const fraction = Math.max(Math.min(localX / rect.width, 1), 0)

	model.value = props.min + fraction * (props.max - props.min)
}

useEventListener(
	() => (dragging.value ? window : undefined),
	"mousemove",
	(ev: MouseEvent) => {
		updateModelWithMouse(ev)
	}
)

useEventListener(
	() => (dragging.value ? window : undefined),
	"mouseup",
	(ev: MouseEvent) => {
		updateModelWithMouse(ev)
		dragging.value = false
		commitUndo()
	}
)
</script>

<style scoped>
.gradient-slider {
	position: relative;
	border-radius: var(--border-radius);
}

.dot {
	position: absolute;
	width: 10px;
	height: 10px;
	background: transparent;
	border-radius: 50%;
	box-shadow: 0px 0px 0px 1.5px rgb(255 255 255), inset 0px 0px 1px 1.5px rgb(0 0 0 / 30%);
}

.picker-input :deep(input) {
	width: 70px;
}

.slider-label {
	color: var(--p-text-muted-color);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
</style>
