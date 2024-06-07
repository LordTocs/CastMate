<template>
	<data-input-base v-model="model" :schema="schema" v-slot="inputProps" :is-template="isTemplate">
		<div class="container w-full" ref="container">
			<input-box v-bind="inputProps" :model="model" @click="toggle">
				<div class="color-splash" :style="{ backgroundColor: model }"></div>
			</input-box>
		</div>
		<drop-down-panel v-model="overlayVisible" :container="container">
			<p-color-picker v-model="poundConverter" inline />
		</drop-down-panel>
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"
import InputBox from "../base-components/InputBox.vue"
import { Color, isHexColor, SchemaColor } from "castmate-schema"
import { computed, onMounted, ref, useModel, watch } from "vue"
import PColorPicker from "primevue/colorpicker"
import { SharedDataInputProps } from "../DataInputTypes"
import DropDownPanel from "../base-components/DropDownPanel.vue"

const props = defineProps<
	{
		modelValue: Color | string | undefined
		schema: SchemaColor
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

function isTemplate(value: Color | string | undefined) {
	return !!(value && isHexColor(value))
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
