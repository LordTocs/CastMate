<template>
	<div v-if="!editing && schema" @click="startEdit" class="var-display-edit">
		<data-view :model-value="model" :schema="schema" />
	</div>

	<form class="flex flex-row" @submit.prevent="accept" v-else-if="schema" @keydown="onKeyDown">
		<data-input class="flex-grow-1" v-model="editValue" :schema="schema" />
		<p-button icon="pi pi-check" text @click="accept"></p-button>
		<p-button icon="pi pi-times" text @click="reject"></p-button>
	</form>

	<div v-else>INVALID SCHEMA</div>
</template>

<script setup lang="ts">
import { Schema } from "castmate-schema"
import { DataView, DataInput, usePropagationStop } from "castmate-ui-core"
import { ref } from "vue"
import _cloneDeep from "lodash/cloneDeep"
import PButton from "primevue/button"
import { useModel } from "vue"

const props = defineProps<{
	modelValue: any
	schema: Schema
}>()

const model = useModel(props, "modelValue")

const editing = ref(false)
const editValue = ref<any>(undefined)

const stopPropagation = usePropagationStop()

function startEdit(ev: MouseEvent) {
	if (ev.button != 0) return

	stopPropagation(ev)
	ev.preventDefault()

	editing.value = true
	editValue.value = _cloneDeep(props.modelValue)
}

async function accept() {
	model.value = editValue.value
	editing.value = false
}

function reject() {
	editing.value = false
	editValue.value = undefined
}

function onKeyDown(ev: KeyboardEvent) {
	if (ev.code == "Escape") {
		reject()
	}
}
</script>

<style scoped>
.var-display-edit {
	cursor: pointer;
}
</style>
