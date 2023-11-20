<template>
	<div class="container" ref="container">
		<div class="p-inputgroup" @mousedown="stopPropagation">
			<label-floater :no-float="props.noFloat" :label="schema.name" input-id="color" v-slot="labelProps">
				<template-toggle
					v-model="model"
					:template-mode="templateMode"
					v-bind="labelProps"
					v-slot="templateProps"
				>
					<div
						class="p-dropdown p-inputwrapper"
						:class="{
							'p-filled': model != null,
							'p-focused': focused,
							'p-inputwrapper-filled': model != null,
							'p-inputwrapper-focused': focused || overlayVisible,
							'fix-right': !schema.required || schema.template,
						}"
						v-bind="templateProps"
						@click="toggle"
					>
						<div class="p-dropdown-label p-inputtext">
							<div v-if="model" class="color-splash" :style="{ backgroundColor: model }"></div>
							<span v-else>&nbsp;</span>
						</div>
					</div>
				</template-toggle>
			</label-floater>
			<p-button
				class="flex-none no-focus-highlight"
				v-if="schema.template"
				icon="mdi mdi-code-braces"
				@click="toggleTemplate"
			/>
			<p-button class="flex-none no-focus-highlight" v-if="!schema.required" icon="pi pi-times" @click="clear" />
		</div>
		<drop-down-panel v-model="overlayVisible" :container="container">
			<p-color-picker v-model="poundConverter" inline />
		</drop-down-panel>
	</div>
</template>

<script setup lang="ts">
import { SchemaColor } from "castmate-schema"
import { Color, isHexColor } from "castmate-schema"
import { computed, onMounted, ref, useModel, watch } from "vue"
import PButton from "primevue/button"
import PColorPicker from "primevue/colorpicker"
import { stopPropagation } from "../../../main"
import { SharedDataInputProps } from "../DataInputTypes"
import LabelFloater from "../base-components/LabelFloater.vue"
import TemplateToggle from "../base-components/TemplateToggle.vue"
import DropDownPanel from "../base-components/DropDownPanel.vue"

const props = defineProps<
	{
		modelValue: Color | string | undefined
		schema: SchemaColor
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const isColorString = computed(() => {
	return !model.value || isHexColor(model.value)
})

function clear() {
	model.value = undefined
}
const focused = ref(false)

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

const templateMode = ref(false)
onMounted(() => {
	templateMode.value = !isColorString.value
})

function toggleTemplate() {
	if (!props.schema.template) {
		return
	}

	templateMode.value = !templateMode.value
}
</script>

<style scoped>
.container {
	cursor: pointer;
	position: relative;
	user-select: none;
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

.fix-right {
	border-top-right-radius: 0 !important;
	border-bottom-right-radius: 0 !important;
}
</style>
