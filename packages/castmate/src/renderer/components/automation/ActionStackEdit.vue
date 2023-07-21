<template>
	<div class="stack">
		<instant-action-edit
			v-for="(a, i) in props.modelValue.stack"
			:key="a.id"
			v-model="modelObj.stack[i]"
			:top-point="i == 0 && topPoint"
		>
		</instant-action-edit>
	</div>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { type ActionStack } from "castmate-schema"
import InstantActionEdit from "./InstantActionEdit.vue"

const props = withDefaults(defineProps<{ modelValue: ActionStack; topPoint: boolean }>(), { topPoint: false })
const emit = defineEmits(["update:modelValue"])
const modelObj = useVModel(props, "modelValue", emit)
</script>

<style scoped>
.stack {
	display: flex;
	flex-direction: column;
}
</style>
