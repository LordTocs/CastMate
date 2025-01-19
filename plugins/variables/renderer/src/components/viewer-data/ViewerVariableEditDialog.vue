<template>
	<div ref="container" v-if="variableDef" class="variable-edit-dialog">
		<p-input-group>
			<p-float-label variant="on">
				<variable-name-input v-model="variableDef.name" />
				<label for="name"> Variable Name </label>
			</p-float-label>
		</p-input-group>
		<p-input-group>
			<p-float-label variant="on">
				<p-dropdown
					v-model="variableDef.type"
					:options="variableTypeOptions"
					option-value="code"
					option-label="name"
					input-id="type"
				/>
				<label for="type"> Type </label>
			</p-float-label>
		</p-input-group>
		<div>
			<p-check-box binary input-id="check" v-model="variableDef.required" />
			<label for="check" class="ml-2"> Required Value </label>
		</div>
		<data-input
			v-if="defaultValueSchema"
			class="var-edit"
			v-model="variableDef.defaultValue"
			:schema="defaultValueSchema"
			local-path="defaultValue"
		/>
		<div class="flex justify-content-end mt-1">
			<p-button :label="isCreate ? 'Create' : 'Save'" @click="submit"></p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, markRaw } from "vue"
import { getAllViewerVariableTypes, ViewerVariable, getTypeByConstructor, getTypeByName, Schema } from "castmate-schema"
import { useDialogRef, DataInput, provideScrollAttachable, VariableNameInput } from "castmate-ui-core"

import PButton from "primevue/button"
import PDropdown from "primevue/dropdown"
import PCheckBox from "primevue/checkbox"
import PFloatLabel from "primevue/floatlabel"
import PInputGroup from "primevue/inputgroup"
import type { MenuItem } from "primevue/menuitem"

const isCreate = ref(true)
const dialogRef = useDialogRef()

interface ViewerVariableEditDesc {
	name: string
	type: string
	required: boolean
	defaultValue: any
}

const variableDef = ref<ViewerVariableEditDesc>()

const defaultValueSchema = computed<Schema | undefined>(() => {
	if (!variableDef.value) return undefined

	const type = getTypeByName(variableDef.value.type)

	if (!type) return undefined

	return {
		type: type.constructor,
		name: "Default Value",
		required: variableDef.value.required,
	}
})

onMounted(async () => {
	if (!dialogRef.value?.data) {
		//Default, we're creating new
		isCreate.value = true
		variableDef.value = {
			name: "",
			type: "Number",
			required: true,
			defaultValue: 0,
		}
	} else {
		isCreate.value = false
		const def = dialogRef.value.data as ViewerVariable
		variableDef.value = {
			name: def.name,
			type: getTypeByConstructor(def.schema.type)?.name ?? "Number",
			required: def.schema.required ?? false,
			defaultValue: def.schema.default,
		}
	}
})

const container = ref<HTMLElement>()
provideScrollAttachable(container)

const variableTypes = computed(() => {
	return getAllViewerVariableTypes().map((t) => t.name)
})

const variableTypeOptions = computed<MenuItem[]>(() => {
	return variableTypes.value.map((v) => ({
		code: v,
		name: v,
	}))
})

function submit() {
	if (!variableDef.value) return undefined

	const type = getTypeByName(variableDef.value.type)

	if (!type) return undefined

	dialogRef.value?.close({
		name: variableDef.value.name,
		schema: {
			type: type.constructor,
			required: variableDef.value.required,
			default: variableDef.value.defaultValue,
		},
	})
}
</script>

<style scoped>
.variable-edit-dialog :deep(.var-edit) {
	margin-top: 1.5rem;
}
</style>
