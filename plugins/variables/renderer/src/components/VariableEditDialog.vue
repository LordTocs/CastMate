<template>
	<div ref="container" v-if="variableDef" class="variable-edit-dialog">
		<div class="p-inputgroup var-edit">
			<span class="p-float-label">
				<p-input-text
					id="name"
					v-model="variableDef.id"
					ref="nameInput"
					autofocus
					:pattern="String(jsNameRegex)"
				/>
				<label for="name"> Variable Name </label>
			</span>
		</div>
		<div class="p-inputgroup var-edit">
			<span class="p-float-label">
				<p-dropdown
					v-model="typeName"
					:options="variableTypeOptions"
					option-value="code"
					option-label="name"
					input-id="type"
				/>
				<label for="type"> Type </label>
			</span>
		</div>
		<data-input
			class="var-edit"
			v-model="variableDef.defaultValue"
			:schema="{ ...variableDef.schema, name: 'Default Value' }"
		/>
		<div class="p-inputgroup var-edit" v-bind="$attrs">
			<p-check-box binary input-id="check" v-model="variableDef.serialized" />
			<label for="check" class="ml-2"> Saved </label>
		</div>
		<div class="flex justify-content-end mt-1">
			<p-button :label="isCreate ? 'Create' : 'Save'" @click="submit"></p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, ref } from "vue"
import { useDialogRef, DataInput, provideScrollAttachable } from "castmate-ui-core"
import _cloneDeep from "lodash/cloneDeep"

import PDropdown from "primevue/dropdown"

import { RendererVariableDefinition } from "../variable-store"
import { getTypeByConstructor, getAllTypes } from "castmate-schema"
import { getTypeByName } from "castmate-schema"
import { jsNameRegex } from "castmate-plugin-variables-shared"

import PButton from "primevue/button"
import PInputText from "primevue/inputtext"
import PCheckBox from "primevue/checkbox"
import { MenuItem } from "primevue/menuitem"
import { constructDefault } from "castmate-schema"

const container = ref<HTMLElement>()
const dialogRef = useDialogRef()
const variableDef = ref<RendererVariableDefinition>()
const isCreate = ref(true)

provideScrollAttachable(container)

const typeName = computed<string | undefined>({
	get() {
		if (!variableDef.value) return undefined

		const type = getTypeByConstructor(variableDef.value.schema.type)

		if (!type) return undefined

		return type.name
	},
	set(value) {
		if (!value) return
		if (!variableDef.value) return
		const type = getTypeByName(value)
		if (!type) return

		let needsNewDefault = false
		if (variableDef.value.schema.type != type.constructor) {
			//Also reset the default
			needsNewDefault = true
		}

		variableDef.value.schema.type = markRaw(type.constructor)

		if (needsNewDefault) {
			constructDefault(variableDef.value.schema).then((v) => {
				if (!variableDef.value) return
				variableDef.value.defaultValue = v
			})
		}
	},
})

onMounted(async () => {
	if (!dialogRef.value?.data) {
		//Default, we're creating new
		isCreate.value = true
		variableDef.value = {
			id: "",
			schema: {
				type: markRaw(String),
				required: true,
			},
			defaultValue: "",
			serialized: true,
		}
	} else {
		isCreate.value = false
		const def = dialogRef.value.data as RendererVariableDefinition
		variableDef.value = {
			id: def.id,
			serialized: def.serialized,
			//@ts-ignore
			schema: { type: def.schema.type, required: true },
			defaultValue: _cloneDeep(def.defaultValue),
		}
	}
})

//Types dropdown
const variableTypes = computed(() => {
	return getAllTypes().map((t) => t.name)
})

const variableTypeOptions = computed<MenuItem[]>(() => {
	return variableTypes.value.map((v) => ({
		code: v,
		name: v,
	}))
})

function submit() {
	dialogRef.value?.close(variableDef.value)
}
</script>

<style scoped>
.variable-edit-dialog :deep(.var-edit) {
	margin-top: 1.5rem;
}
</style>
