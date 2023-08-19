<template>
	<div class="stack" ref="actionStack" :class="{ 'action-dragging': dragging }" draggable="true">
		<instant-action-edit v-model="action" :in-stack="true" @automation-drop="onAutomationDrop" />
		<action-stack-edit :offset="offset + 1" v-if="offset + 1 < modelObj.stack.length" v-model="modelObj" />
	</div>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { computed, ref } from "vue"
import { type ActionStack } from "castmate-schema"
import InstantActionEdit from "./InstantActionEdit.vue"
import { useSequenceDrag } from "../../util/automation-dragdrop"
import _cloneDeep from "lodash/cloneDeep"
import { nanoid } from "nanoid/non-secure"
import { Sequence } from "castmate-schema"

const props = withDefaults(defineProps<{ modelValue: ActionStack; offset?: number }>(), { offset: 0 })
const emit = defineEmits(["update:modelValue"])
const modelObj = useVModel(props, "modelValue", emit)

const action = computed({
	get() {
		return modelObj.value.stack[props.offset]
	},
	set(v) {
		modelObj.value.stack[props.offset] = v
	},
})

const actionStack = ref<HTMLElement | null>(null)
const { dragging } = useSequenceDrag(
	computed(() => (props.offset != 0 ? actionStack.value : null)),
	() => {
		console.log("Stack Clone")
		const stack = _cloneDeep(modelObj.value.stack.slice(props.offset))

		if (stack.length == 1) {
			return { actions: [stack[0]] }
		} else {
			return { actions: [{ id: nanoid(), stack }] }
		}
	},
	() => {
		console.log("Removing Stack After", props.offset)
		const newStack = [...modelObj.value.stack]
		newStack.splice(props.offset, newStack.length - props.offset)
		if (newStack.length > 1) {
			modelObj.value.stack = newStack
		} else if (newStack.length == 1) {
			//@ts-ignore I'm not sure how to get it to not care, but we're destroying the stack this way
			modelObj.value = newStack[0]
		} else {
			//WE shouldn't hit here
			console.error("How did this happen??")
		}
	}
)

function onAutomationDrop(sequence: Sequence) {
	const newStack = [...modelObj.value.stack]

	const rootAction = sequence.actions[0]

	if ("stack" in rootAction) {
		newStack.splice(props.offset, 0, ...rootAction.stack)
	} else {
		//TODO: Validate it's an instant action
		newStack.splice(props.offset + 1, 0, rootAction)
	}

	modelObj.value.stack = newStack
}
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
