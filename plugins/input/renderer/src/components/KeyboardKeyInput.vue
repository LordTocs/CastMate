<template>
	<div class="p-inputgroup w-full">
		<!-- <label-floater :label="schema.name" v-slot="labelProps" input-id="keyboardkey" :no-float="!!noFloat">
			<input-box
				class="key-input"
				:class="{ 'capture-mode': captureMode }"
				ref="inputRef"
				:model="model"
				v-bind="labelProps"
				tabindex="-1"
				@focus="onFocus"
				@blur="onBlur"
				:focused="focused"
				@keydown="onKeyDown"
				@keyup="onKeyUp"
			/>
		</label-floater> -->
		<c-autocomplete
			class="key-input"
			:class="{ 'capture-mode': captureMode }"
			:items="keyItems"
			:label="schema.name"
			:required="!!schema.required"
			v-model="model"
			ref="inputRef"
			:no-float="noFloat"
			input-id="keyboard-key"
			text-prop="name"
			@keydown="onKeyDown"
			@keyup="onKeyUp"
		>
			<template #append>
				<p-button class="flex-none no-focus-highlight" icon="mdi mdi-keyboard" @click="startCapture"></p-button>
			</template>
		</c-autocomplete>
	</div>
</template>

<script setup lang="ts">
import { CAutocomplete, SharedDataInputProps } from "castmate-ui-core"
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

function startCapture(ev: MouseEvent) {
	ev.stopPropagation()
	captureMode.value = true
	inputRef.value?.$el?.focus()
}

function onKeyDown(ev: KeyboardEvent) {
	if (!captureMode.value) return

	//console.log(ev.key)
	ev.stopPropagation()
	ev.preventDefault()
}

function onKeyUp(ev: KeyboardEvent) {
	if (!captureMode.value) return

	const key = getKeyboardKey(ev)
	if (key) {
		captureMode.value = false
		model.value = key
	}

	ev.stopPropagation()
	ev.preventDefault()
}
</script>

<style scoped>
.capture-mode :deep(.p-dropdown) {
	/* box-shadow: 0 0 0 1px green; */
	border-color: green;
}
</style>
