<template>
	<div class="array-input">
		<div class="array-header flex flex-row align-items-center">
			{{ schema.name }}
			<div class="flex-grow-1"></div>
			<p-button icon="pi pi-plus" class="extra-small-button" @click="addItem" size="small"></p-button>
		</div>
		<div class="flex flex-column gap-1">
			<div class="array-item" v-if="model" v-for="(item, index) in modelValue">
				<div class="array-item-header flex flex-row align-items-center w-full gap-1 p-2">
					<div class="flex-grow-1" />
					<p-button
						icon="mdi mdi-content-copy"
						class="extra-small-button"
						size="small"
						@click="duplicateItem(index)"
					></p-button>
					<p-button
						icon="mdi mdi-delete"
						class="extra-small-button"
						size="small"
						@click="deleteItem(index)"
					></p-button>
				</div>
				<div class="flex-grow-1">
					<data-input
						v-model="model[index]"
						:schema="schema.items"
						:no-float="noFloat"
						:secret="secret"
						:context="context"
						:local-path="localPath"
					/>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { SchemaArray } from "castmate-schema"
import { SharedDataInputProps } from "../DataInputTypes"
import { useModel } from "vue"
import DataInput from "../DataInput.vue"
import PButton from "primevue/button"
import _cloneDeep from "lodash/cloneDeep"
import { constructDefault } from "castmate-schema"

const props = defineProps<
	{
		modelValue: Array<any> | undefined
		schema: SchemaArray
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

function duplicateItem(idx: number) {
	const dupe = _cloneDeep(model.value?.[idx])

	if (model.value == null) {
		return
	}

	model.value.splice(idx, 0, dupe)
}

function deleteItem(idx: number) {
	model.value?.splice(idx, 1)

	if (model.value?.length == 0 && !props.schema.required) {
		model.value = undefined
	}
}

async function addItem() {
	const newItem = await constructDefault(props.schema.items)

	if (model.value == null) {
		model.value = [newItem]
	} else {
		model.value.push(newItem)
	}
}
</script>

<style scoped>
.array-input {
	border-radius: var(--border-radius);
	border: solid 1px var(--surface-border);
	border-radius: var(--border-radius);
}

.array-header {
	padding: 0.5rem 0.5rem;
}

.array-item {
	/* border-radius: var(--border-radius); */
	/* padding: 0.5rem; */
	border-top: solid 1px var(--surface-border);
	/* border-radius: var(--border-radius); */
}
</style>
