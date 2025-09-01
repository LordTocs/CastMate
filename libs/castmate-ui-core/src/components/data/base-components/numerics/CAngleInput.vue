<template>
	<div class="angle-knob" :class="{ 'knob-dragging': dragging }" ref="knobDiv">
		<div class="knob-line"></div>
	</div>
</template>

<script setup lang="ts">
import { useTemplateRef } from "vue"
import { useDragAngle } from "../../../../main"

const model = defineModel<number>()
const props = defineProps<{}>()

const knobDiv = useTemplateRef("knobDiv")
const dragging = useDragAngle(knobDiv, model, {})
</script>

<style scoped>
.angle-knob {
	border-radius: 100000px;
	background: var(--p-inputtext-background);
	border: 1px solid var(--p-inputtext-border-color);

	position: relative;

	/*TODO: Do this better */
	aspect-ratio: 1;
	height: 26px;
}

.knob-dragging {
	border-color: var(--p-primary-color);
}

.knob-line {
	position: absolute;

	left: 50%;
	top: 50%;
	width: 50%;
	border-bottom: 1px solid var(--p-inputtext-border-color);

	transform-origin: top left;
	transform: rotate(v-bind("`${(model ?? 0)}deg`"));
}

.knob-dragging .knob-line {
	border-color: var(--p-primary-color);
}
</style>
