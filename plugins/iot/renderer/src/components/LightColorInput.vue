<template>
	<div class="light-color-container flex-grow-1" ref="container">
		<div class="p-inputgroup" @mousedown="stopPropagation">
			<label-floater :no-float="noFloat" :label="schema.name" input-id="light-color" v-slot="labelProps">
				<template-toggle v-model="model" :template-mode="false" v-bind="labelProps" v-slot="templateProps">
					<input-box v-bind="templateProps" :model="model" @click="onClick">
						<div
							class="color-splash"
							:style="{ backgroundColor: model != null ? LightColor.toColor(model) : undefined }"
						></div>
					</input-box>
				</template-toggle>
			</label-floater>
			<p-button class="flex-none no-focus-highlight" v-if="!schema.required" icon="pi pi-times" @click="clear" />
		</div>
		<drop-down-panel v-model="overlayVisible" :container="container">
			<p-tab-view v-model="tabIndex">
				<p-tab-panel header="RGB">
					<light-color-wheel style="width: 15rem" v-model="model" />
				</p-tab-panel>
				<p-tab-panel header="Temp">
					<light-temperature-slider style="height: 15rem" v-model="model" />
				</p-tab-panel>
			</p-tab-view>
		</drop-down-panel>
	</div>
</template>

<script setup lang="ts">
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
import LightTemperatureSlider from "./LightTemperatureSlider.vue"
import PButton from "primevue/button"
import PTabView from "primevue/tabview"
import PTabPanel from "primevue/tabpanel"

const props = defineProps<
	{
		modelValue: LightColor | undefined
		schema: SchemaLightcolor
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const container = ref<HTMLElement>()
const overlayVisible = ref(false)

const tabIndex = ref(0)

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

function clear() {
	console.log("Clear!")
	model.value = undefined
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
