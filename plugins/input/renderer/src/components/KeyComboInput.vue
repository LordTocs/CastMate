<template>
	<data-input-base v-model="model" :schema="schema" :no-float="noFloat" :local-path="localPath">
		<template #default="inputProps">
			<input-box
				class="key-input"
				:class="{ 'capture-mode': captureMode }"
				ref="inputRef"
				:model="modelString"
				v-bind="inputProps"
				tabindex="-1"
				@focus="onFocus"
				@blur="onBlur"
				:focused="focused"
				@keydown="onKeyDown"
				@keyup="onKeyUp"
			/>
		</template>

		<template #extra>
			<p-button class="flex-none no-focus-highlight" icon="mdi mdi-keyboard" @click="startCapture"></p-button>
		</template>
	</data-input-base>
</template>

<script setup lang="ts">
import {
	LabelFloater,
	InputBox,
	SharedDataInputProps,
	DataInputBase,
	usePropagationStop,
	useDataBinding,
	useUndoCommitter,
	useCommitUndo,
} from "castmate-ui-core"
import { KeyboardKey, SchemaKeyboardKey, Keys, getKeyboardKey, KeyCombo } from "castmate-plugin-input-shared"
import { computed, ref, useModel } from "vue"
import PButton from "primevue/button"

const props = defineProps<
	{
		modelValue: KeyCombo | undefined
		schema: SchemaKeyboardKey
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

useDataBinding(() => props.localPath)

const captureMode = ref(false)
const inputRef = ref<InstanceType<typeof InputBox>>()
const focused = ref(false)

const modelString = computed(() => {
	if (!model.value) return undefined
	if (model.value.length == 0) return undefined

	let result = ""

	for (let i = 0; i < model.value.length; ++i) {
		const key = model.value[i]
		let name: string = key
		if (name.startsWith("Left")) {
			name = name.substring(4)
		}

		result += name

		if (i != model.value.length - 1) {
			result += " + "
		}
	}

	return result
})

const stopPropagation = usePropagationStop()

const commitUndo = useCommitUndo()

function startCapture(ev: MouseEvent) {
	stopPropagation(ev)
	captureMode.value = true
	model.value = []
	inputRef.value?.$el?.focus()
}

function onFocus(ev: FocusEvent) {
	focused.value = true
}

function onBlur(ev: FocusEvent) {
	focused.value = false
}

function onKeyDown(ev: KeyboardEvent) {
	if (!captureMode.value) return

	if (!model.value) model.value = []
	const key = getKeyboardKey(ev)
	if (key) {
		KeyCombo.append(model.value, key)
	}

	//console.log(ev.key)
	ev.stopPropagation()
	ev.preventDefault()
}

function onKeyUp(ev: KeyboardEvent) {
	if (!captureMode.value) return

	captureMode.value = false
	commitUndo()

	ev.stopPropagation()
	ev.preventDefault()
}

function clear(ev: MouseEvent) {
	model.value = undefined
}
</script>

<style scoped>
.capture-mode :deep(.p-inputtext) {
	/* box-shadow: 0 0 0 1px green; */
	border-color: green;
}
</style>
