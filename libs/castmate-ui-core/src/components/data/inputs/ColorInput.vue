<template>
	<data-input-base v-model="model" :schema="schema" v-slot="inputProps" :is-template="isTemplate" ref="dataInputBase">
		<div class="container w-full" ref="container">
			<input-box v-bind="inputProps" :model="model" @click="toggle" ref="inputBox">
				<div class="color-splash" :style="{ backgroundColor: model }"></div>
			</input-box>
		</div>
		<drop-down-panel class="p-1" v-model="overlayVisible" :container="container">
			<!-- <p-color-picker v-model="poundConverter" inline /> -->
			<c-color-picker v-model="model" />
		</drop-down-panel>
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"
import InputBox from "../base-components/InputBox.vue"
import { Color, isHexColor, SchemaColor } from "castmate-schema"
import { computed, onMounted, ref, useModel, watch } from "vue"
import PColorPicker, { ColorPickerChangeEvent } from "primevue/colorpicker"
import { SharedDataInputProps } from "../DataInputTypes"
import DropDownPanel from "../base-components/DropDownPanel.vue"
import { useDataBinding, useDataUIBinding } from "../../../util/data-binding"

import CColorPicker from "../base-components/CColorPicker.vue"

const props = defineProps<
	{
		modelValue: Color | string | undefined
		schema: SchemaColor
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

function isTemplate(value: Color | string | undefined) {
	return !!(value && !isHexColor(value))
}

const overlayVisible = ref(false)

const poundConverter = computed<string | undefined>({
	get() {
		if (!props.modelValue) return undefined
		return props.modelValue.slice(1)
	},
	set(v: string | undefined) {
		if (!v) {
			model.value = v as Color | undefined
		}
		model.value = ("#" + v) as Color
	},
})

function show() {
	if (!overlayVisible.value) {
		overlayVisible.value = true
	}
}
function hide() {
	overlayVisible.value = false
}
function toggle(ev: MouseEvent) {
	if (ev.button != 0) return

	ev.stopImmediatePropagation()

	if (overlayVisible.value) {
		hide()
	} else {
		show()
	}
}

const container = ref<HTMLElement | null>(null)
const inputBox = ref<InstanceType<typeof InputBox>>()
const dataInputBase = ref<InstanceType<typeof DataInputBase>>()

useDataUIBinding({
	focus() {
		inputBox.value?.inputDiv?.focus()
	},
	scrollIntoView() {
		inputBox.value?.inputDiv?.scrollIntoView()
	},
})

function onChange(ev: ColorPickerChangeEvent) {
	console.log(ev)
}
</script>

<style scoped>
.container {
	cursor: pointer;
	position: relative;
	user-select: none;

	display: flex;
	flex-direction: row;
}

.overlay {
	position: absolute;
	max-height: 25rem;
	overflow-y: auto;
}

.color-splash {
	display: inline-block;
	height: 1em;
	width: 100%;
	border-radius: var(--border-radius);
	vertical-align: bottom;
}
</style>
