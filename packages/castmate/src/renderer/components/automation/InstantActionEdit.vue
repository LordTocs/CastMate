<template>
	<div class="instant-action" :style="{ ...actionColorStyle }">
		<div class="instant-action-header action-handle">
			<i class="mdi flex-none" :class="action?.icon" />
			{{ action?.name }}
		</div>
		<automation-drop-zone
			:drop-key="`${modelValue.id}-bottom`"
			drop-axis="horizontal"
			drop-location="middle"
			style="left: 0; top: calc(var(--timeline-height) / 2); right: 0; height: var(--timeline-height)"
		/>
	</div>
</template>

<script setup lang="ts">
import { InstantAction } from "castmate-schema"
import { useAction, useActionColors } from "castmate-ui-core"
import { useModel } from "vue"
import AutomationDropZone from "./AutomationDropZone.vue"
const props = withDefaults(
	defineProps<{
		modelValue: InstantAction
		inStack?: boolean
	}>(),
	{
		inStack: false,
	}
)

const modelObj = useModel(props, "modelValue")

const action = useAction(() => props.modelValue)
const { actionColorStyle } = useActionColors(() => props.modelValue)
</script>

<style scoped>
.action-dragging .instant-action {
	/* border: solid 2px red; */
}

.instant-action {
	position: relative;
	border-radius: var(--border-radius);
	background-color: var(--action-color);
	border: solid 2px var(--lighter-action-color);

	height: var(--timeline-height);
	width: var(--instant-width);
}

.instant-action-header {
	background-color: var(--darker-action-color);
	height: 1.5rem;
	cursor: grab;

	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);
}

.instant-action.top-point:before {
	content: "";
	display: block;
	position: absolute;
	right: calc((var(--instant-width) - (2 * var(--point-size))) / 2);
	top: calc(-1 * var(--point-size));
	border-bottom: var(--point-size) solid var(--lighter-action-color);
	border-left: var(--point-size) solid transparent;
	border-right: var(--point-size) solid transparent;
}
</style>
