<template>
	<div class="light-color-container flex-grow-1" ref="container">
		<div class="p-inputgroup" @mousedown="stopPropagation">
			<label-floater :no-float="noFloat" :label="schema.name" input-id="light-color" v-slot="labelProps">
				<template-toggle v-model="model" :template-mode="false" v-bind="labelProps" v-slot="templateProps">
					<input-box v-bind="templateProps" :model="model" @click="onClick">
						<div
							class="color-splash"
							:style="{ backgroundColor: model ? LightColor.toColor(model) : undefined }"
						></div>
					</input-box>
				</template-toggle>
			</label-floater>
		</div>
		<drop-down-panel v-model="overlayVisible" :container="container">
			<light-color-wheel style="width: 15rem" v-if="LightColor.isHSB(model) || !model" v-model="model" />
		</drop-down-panel>
	</div>
</template>

<script setup lang="ts">
import PPortal from "primevue/portal"
import { LightColor, SchemaLightcolor } from "castmate-plugin-iot-shared"
import {
	LabelFloater,
	TemplateToggle,
	InputBox,
	SharedDataInputProps,
	stopPropagation,
	injectScrollAttachable,
	DropDownPanel,
} from "castmate-ui-core"
import { ref, useModel } from "vue"
import LightColorWheel from "./LightColorWheel.vue"

const props = defineProps<
	{
		modelValue: LightColor | undefined
		schema: SchemaLightcolor
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

//Overlay stuff

const appendTo = injectScrollAttachable()

const container = ref<HTMLElement>()
const overlayDiv = ref<HTMLElement>()

const overlayVisible = ref(false)

function show() {
	if (!overlayVisible.value) {
		overlayVisible.value = true
	}
}
function hide() {
	overlayVisible.value = false
}

function toggle() {
	if (overlayVisible.value) {
		hide()
	} else {
		show()
	}
}

function onClick(ev: MouseEvent) {
	toggle()
	ev.stopPropagation()
	ev.preventDefault()
}
</script>

<style scoped>
.color-splash {
	display: inline-block;
	height: 1em;
	width: 100%;
	border-radius: var(--border-radius);
	vertical-align: bottom;
}

.overlay {
	border-radius: var(--border-radius);
}
</style>
