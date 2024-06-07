<template>
	<data-input-base
		v-model="model"
		:schema="schema"
		:no-float="noFloat"
		v-slot="inputProps"
		:class="{ 'capture-mode1': captureMode }"
	>
		<c-autocomplete
			class="key-input"
			:items="keyItems"
			:label="schema.name"
			:required="!!schema.required"
			v-model="model"
			ref="inputRef"
			:no-float="noFloat"
			text-prop="name"
			@keydown="onKeyDown"
			@keyup="onKeyUp"
			v-bind="inputProps"
		>
			<template #append>
				<p-button class="flex-none no-focus-highlight" icon="mdi mdi-keyboard" @click="startCapture"></p-button>
			</template>
		</c-autocomplete>
	</data-input-base>
</template>

<script setup lang="ts">
import { CAutocomplete, SharedDataInputProps, DataInputBase, usePropagationStop } from "castmate-ui-core"
import { KeyboardKey, SchemaKeyboardKey, Keys, getKeyboardKey } from "castmate-plugin-input-shared"
import { computed, ref, useModel } from "vue"
import PButton from "primevue/button"

const props = defineProps<
	{
		modelValue: KeyboardKey | undefined
		schema: SchemaKeyboardKey
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const captureMode = ref(false)
const focused = ref(false)
const inputRef = ref<InstanceType<typeof CAutocomplete>>()
const keyItems = computed(() => {
	return Object.keys(Keys).map((k) => ({ id: k, name: k }))
})

const stopPropagation = usePropagationStop()

function startCapture(ev: MouseEvent) {
	stopPropagation(ev)
	captureMode.value = true
	//inputRef.value?.$el?.focus()
}

function onKeyDown(ev: KeyboardEvent) {
	if (!captureMode.value) return

	//console.log(ev.key)
	stopPropagation(ev)
	ev.preventDefault()
}

function onKeyUp(ev: KeyboardEvent) {
	if (!captureMode.value) return

	const key = getKeyboardKey(ev)
	if (key) {
		captureMode.value = false
		model.value = key
	}

	stopPropagation(ev)
	ev.preventDefault()
}
</script>

<style scoped>
.capture-mode1 :deep(.p-inputtext) {
	/* box-shadow: 0 0 0 1px green; */
	border-color: green;
}
</style>
