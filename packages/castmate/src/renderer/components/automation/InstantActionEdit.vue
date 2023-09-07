<template>
	<div
		class="instant-action"
		:class="{ 'is-selected': isSelected, 'is-testing': testTime != null }"
		:style="{ ...actionColorStyle }"
		ref="instantAction"
	>
		<div class="instant-action-header action-handle">
			<i class="mdi flex-none" :class="action?.icon" />
			{{ action?.name }}
		</div>
		<automation-drop-zone
			:drop-key="`${modelValue.id}-bottom`"
			:key="`${modelValue.id}-bottom`"
			drop-axis="horizontal"
			drop-location="middle"
			style="left: 0; top: calc(var(--timeline-height) / 2); right: 0; height: var(--timeline-height)"
			is-stack
			@automation-drop="onAutomationDrop"
		/>
	</div>
</template>

<script setup lang="ts">
import { InstantAction } from "castmate-schema"
import {
	getElementRelativeRect,
	useAction,
	useActionColors,
	rectangleOverlaps,
	useIsSelected,
	useDocumentPath,
	useActionTestTime,
} from "castmate-ui-core"
import { useModel, ref } from "vue"
import AutomationDropZone from "./AutomationDropZone.vue"
import { Sequence } from "castmate-schema"
import { ActionStack } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import { SelectionPos, Selection } from "castmate-ui-core"

const props = withDefaults(
	defineProps<{
		modelValue: InstantAction
		inStack?: boolean
	}>(),
	{
		inStack: false,
	}
)

const emit = defineEmits(["update:modelValue", "automationDrop"])

const modelObj = useModel(props, "modelValue")
const instantAction = ref<HTMLElement | null>(null)

function onAutomationDrop(sequence: Sequence) {
	if (props.inStack) {
		//forward this to the stack for handling
		emit("automationDrop", sequence)
	} else {
		//Replace ourselves with an action stack
		//Todo: Check that

		const replaceStack: ActionStack = {
			id: nanoid(),
			stack: [props.modelValue],
		}

		const action = sequence.actions[0]
		if ("stack" in action) {
			replaceStack.stack.push(...action.stack)
		} else {
			//TODO: Validate it's an instant action
			replaceStack.stack.push(action as InstantAction)
		}

		emit("update:modelValue", replaceStack)
	}
}

const action = useAction(() => props.modelValue)
const { actionColorStyle } = useActionColors(() => props.modelValue)

const isSelected = useIsSelected(useDocumentPath(), () => props.modelValue.id)

const testTime = useActionTestTime(() => props.modelValue.id)

defineExpose({
	getSelectedItems(container: HTMLElement, from: SelectionPos, to: SelectionPos): Selection {
		if (!instantAction.value) {
			return []
		}

		const rect = getElementRelativeRect(instantAction.value, container)
		const selrect = new DOMRect(from.x, from.y, to.x - from.x, to.y - from.y)
		return rectangleOverlaps(rect, selrect) ? [props.modelValue.id] : []
	},
})
</script>

<style scoped>
/* .action-dragging .instant-action {
	border: solid 2px red;
} */

.instant-action {
	pointer-events: auto;
	position: relative;
	border-radius: var(--border-radius);
	background-color: var(--action-color);
	border: solid 2px var(--lighter-action-color);

	transition: border-color 0.3s;
	transition: background-color 0.3s;

	height: var(--timeline-height);
	width: var(--instant-width);
}

.instant-action-header {
	background-color: var(--darker-action-color);
	height: 1.5rem;
	cursor: grab;

	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);

	transition: background-color 0.3s;
}

.is-selected {
	border-color: white;
}

.is-testing {
	/* border-color: var(--darkest-action-color); */
	transition: border-color 0 !important;
	transition: background-color 0 !important;
	background-color: var(--lighter-action-color) !important;
}

.is-testing .instant-action-header {
	/* background-color: var(--darkest-action-color); */
	transition: background-color 0 !important;
}
</style>
