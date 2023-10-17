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
		<p-portal :append-to="appendTo">
			<transition name="p-connected-overlay" @enter="onOverlayEnter">
				<div
					v-if="overlayVisible"
					class="overlay p-dropdown-panel p-component p-ripple-disabled p-1"
					ref="overlayDiv"
					:style="{
						zIndex: primevue.config.zIndex?.overlay,
					}"
					@mousedown="stopPropagation"
					@click="stopPropagation"
				>
					<light-color-wheel style="width: 15rem" v-if="LightColor.isHSB(model) || !model" v-model="model" />
				</div>
			</transition>
		</p-portal>
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
	positionPortal,
} from "castmate-ui-core"
import { ref, useModel } from "vue"
import { usePrimeVue } from "primevue/config"
import { useEventListener } from "@vueuse/core"
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

const primevue = usePrimeVue()
const container = ref<HTMLElement>()
const overlayDiv = ref<HTMLElement>()

const overlayVisible = ref(false)
const overlayVisibleComplete = ref(false)

function show() {
	if (!overlayVisible.value) {
		overlayVisible.value = true
	}
}
function hide() {
	overlayVisible.value = false
	overlayVisibleComplete.value = false
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

function fixPos() {
	if (!overlayDiv.value) return
	if (!container.value) return
	positionPortal(overlayDiv.value, container.value, appendTo.value)
}

function onOverlayEnter() {
	overlayVisibleComplete.value = true
	fixPos()
}

useEventListener(
	() => (overlayVisibleComplete.value ? document : undefined),
	"click",
	(ev) => {
		if (!container.value?.contains(ev.target as Node) && !overlayDiv.value?.contains(ev.target as Node)) {
			hide()
		}
	}
)
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
