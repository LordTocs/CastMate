<template>
	<data-input-base
		v-model="model"
		:schema="schema"
		:no-float="noFloat"
		v-slot="inputProps"
		ref="inputBase"
		:local-path="localPath"
	>
		<div v-if="!schema.enum" class="w-full">
			<number-field
				v-model="numModel"
				v-bind="inputProps"
				:min="min"
				:max="max"
				:step="step"
				class="w-full"
				ref="numberInput"
			/>
			<p-slider
				v-if="schema.slider"
				v-model="numModel"
				:min="min"
				:max="max"
				:step="step"
				@slideend="onSlideEnd"
			/>
		</div>

		<enum-input
			v-else
			:schema="schema"
			v-model="model"
			:no-float="!!noFloat"
			:context="context"
			v-bind="inputProps"
			ref="enumInput"
		/>
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"
import NumberField from "../base-components/NumberField.vue"
import PSlider from "primevue/slider"
import { type SchemaBase, type SchemaNumber } from "castmate-schema"
import { computed, ref, onMounted, useModel, watch } from "vue"
import EnumInput from "../base-components/EnumInput.vue"
import { SharedDataInputProps } from "../DataInputTypes"
import { useCommitUndo, useDataBinding } from "../../../util/data-binding"

const props = defineProps<
	{
		schema: SchemaNumber & SchemaBase
		modelValue: number | string | undefined
		localPath?: string
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const isSlider = computed(() => props.schema?.slider ?? false)
const min = computed(() => props.schema?.min ?? (isSlider.value ? 0 : undefined))
const max = computed(() => props.schema?.max ?? (isSlider.value ? 100 : undefined))
const step = computed(() => props.schema?.step ?? (isSlider.value ? 1 : undefined))
const unit = computed(() => props.schema?.unit)

const isValueNumber = computed(() => {
	if (props.modelValue == null) return true

	return !isNaN(Number(props.modelValue))
})

const emit = defineEmits(["update:modelValue"])

const model = useModel(props, "modelValue")

const numModel = computed<number | undefined>({
	get() {
		return props.modelValue as number
	},
	set(v) {
		emit("update:modelValue", v)
	},
})

const commitUndo = useCommitUndo()

function onSlideEnd() {
	commitUndo()
}
</script>
