<template>
	<div class="stack" ref="actionStack" :class="{ 'action-dragging': dragging }" :draggable="props.offset != 0">
		<instant-action-edit
			v-model="action"
			:in-stack="true"
			@automation-drop="onAutomationDrop"
			ref="instantAction"
			:hide-drop="substackDragging"
		/>
		<action-stack-edit
			:offset="offset + 1"
			v-if="offset + 1 < model.stack.length"
			v-model="model"
			ref="childStack"
			v-model:dragging="substackDragging"
		/>
	</div>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { computed, onMounted, ref, useModel, watch } from "vue"
import { type ActionStack } from "castmate-schema"
import InstantActionEdit from "./InstantActionEdit.vue"
import { SelectionGetter, useSequenceDrag } from "../../util/automation-dragdrop"
import _cloneDeep from "lodash/cloneDeep"
import { nanoid } from "nanoid/non-secure"
import { Sequence } from "castmate-schema"
import { Selection, SelectionPos } from "../../main"

const props = withDefaults(defineProps<{ modelValue: ActionStack; offset?: number; dragging?: boolean }>(), {
	offset: 0,
})
//const emit = defineEmits(["update:modelValue"])
const model = useModel(props, "modelValue")
const beingDragged = useModel(props, "dragging")

const substackDragging = ref(false)

const action = computed({
	get() {
		return model.value.stack[props.offset]
	},
	set(v) {
		model.value.stack[props.offset] = v
	},
})

const actionStack = ref<HTMLElement | null>(null)
const { dragging, draggingDelayed } = useSequenceDrag(
	computed(() => (props.offset != 0 ? actionStack.value : null)),
	() => {
		const stack = _cloneDeep(model.value.stack.slice(props.offset))

		if (stack.length == 1) {
			return { actions: [stack[0]] }
		} else {
			return { actions: [{ id: nanoid(), stack }] }
		}
	},
	() => {
		console.log("Removing Stack After", props.offset)
		const newStack = [...model.value.stack]
		newStack.splice(props.offset, newStack.length - props.offset)
		if (newStack.length > 1) {
			model.value.stack = newStack
		} else if (newStack.length == 1) {
			//@ts-ignore I'm not sure how to get it to not care, but we're destroying the stack this way
			model.value = newStack[0]
		} else {
			//WE shouldn't hit here
			console.error("How did this happen??")
		}
	}
)

watch(dragging, () => {
	beingDragged.value = dragging.value
})

onMounted(() => {
	beingDragged.value = dragging.value
})

function onAutomationDrop(sequence: Sequence) {
	const newStack = [...model.value.stack]

	const rootAction = sequence.actions[0]

	if ("stack" in rootAction) {
		newStack.splice(props.offset, 0, ...rootAction.stack)
	} else {
		//TODO: Validate it's an instant action
		newStack.splice(props.offset + 1, 0, rootAction)
	}

	model.value.stack = newStack
}

const instantAction = ref<SelectionGetter | null>(null)
const childStack = ref<SelectionGetter | null>(null)

defineExpose({
	getSelectedItems(container: HTMLElement, from: SelectionPos, to: SelectionPos): Selection {
		return [
			...(instantAction.value?.getSelectedItems(container, from, to) ?? []),
			...(childStack.value?.getSelectedItems(container, from, to) ?? []),
		]
	},
	deleteIds(ids: string[]) {
		const newStack = props.modelValue.stack.filter((action) => !ids.includes(action.id))

		if (newStack.length > 1) {
			model.value.stack = newStack
		} else if (newStack.length == 1) {
			//Convert from stack to instant
			//@ts-ignore I'm not sure how to get it to not care, but we're destroying the stack this way
			model.value = newStack[0]
		}

		//TODO: How to tell parent I should delete myself?

		return newStack.length > 0
	},
})
</script>

<style scoped>
.stack {
	display: flex;
	flex-direction: column;
}
.stack.action-dragging {
	opacity: 0.25;
}
</style>
