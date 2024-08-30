<template>
	<value-display-edit v-if="variableDef?.schema" v-model="modelValue" :schema="variableDef.schema" />
</template>

<script setup lang="ts">
import ValueDisplayEdit from "./util/ValueDisplayEdit.vue"
import { computed } from "vue"

import { useVariableDef, useVariableValue, useVariableStore } from "../variable-store"

const props = defineProps<{
	id: string
}>()

const variableDef = useVariableDef(() => props.id)
const variableValue = useVariableValue(() => props.id)
const variableStore = useVariableStore()

const modelValue = computed({
	get() {
		return variableValue.value
	},
	set(val) {
		variableStore.setVariableValue(props.id, val)
	},
})
</script>
