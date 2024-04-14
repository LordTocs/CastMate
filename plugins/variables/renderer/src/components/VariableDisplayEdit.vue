<template>
	<div v-if="!editing && variableDef" @click="startEdit" class="var-display-edit">
		<data-view :model-value="variableValue" :schema="variableDef.schema" />
	</div>

	<form class="flex flex-row" @submit.prevent="accept" v-else-if="variableDef">
		<data-input class="flex-grow-1" v-model="editValue" :schema="variableDef.schema" />
		<p-button icon="pi pi-check" text @click="accept"></p-button>
		<p-button icon="pi pi-times" text @click="reject"></p-button>
	</form>

	<div v-else>INVALID VAR: {{ id }}</div>
</template>

<script setup lang="ts">
import { DataView, DataInput, usePropagationStop } from "castmate-ui-core"
import { ref } from "vue"
import { useVariableStore, useVariableValue, useVariableDef } from "../variable-store"
import _cloneDeep from "lodash/cloneDeep"
import PButton from "primevue/button"

const props = defineProps<{
	id: string
}>()

const variableStore = useVariableStore()
const variableDef = useVariableDef(() => props.id)
const variableValue = useVariableValue(() => props.id)

const editing = ref(false)
const editValue = ref<any>(undefined)

const stopPropagation = usePropagationStop()

function startEdit(ev: MouseEvent) {
	if (ev.button != 0) return

	stopPropagation(ev)
	ev.preventDefault()

	editing.value = true
	editValue.value = _cloneDeep(variableValue.value)
}

async function accept() {
	await variableStore.setVariableValue(props.id, editValue.value)
	editing.value = false
}

function reject() {
	editing.value = false
	editValue.value = undefined
}
</script>

<style scoped>
.var-display-edit {
	cursor: pointer;
}
</style>
