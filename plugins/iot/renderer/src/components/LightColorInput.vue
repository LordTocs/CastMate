<template>
	<data-input-base v-model="model" :schema="schema">
		<template #default="inputProps">
			<div class="light-color-container w-full" ref="container">
				<input-box v-bind="inputProps" :model="model" @click="onClick">
					<div
						class="color-splash"
						:style="{ backgroundColor: model != null ? LightColor.toColor(model) : undefined }"
					></div>
				</input-box>
			</div>
			<drop-down-panel v-model="overlayVisible" :container="container">
				<p-tab-view v-model="tabIndex">
					<p-tab-panel header="RGB">
						<div class="flex flex-row gap-2">
							<light-color-wheel style="width: 15rem" v-model="model" />
							<light-brightness-slider style="height: 15rem" v-model="model" />
						</div>
					</p-tab-panel>
					<p-tab-panel header="Temp">
						<div class="flex flex-row gap-2">
							<light-temperature-slider style="height: 15rem" v-model="model" />
							<light-brightness-slider style="height: 15rem" v-model="model" />
						</div>
					</p-tab-panel>
				</p-tab-view>
			</drop-down-panel>
		</template>
	</data-input-base>
</template>

<script setup lang="ts">
import { LightColor, SchemaLightcolor } from "castmate-plugin-iot-shared"
import {
	InputBox,
	SharedDataInputProps,
	DropDownPanel,
	DataInputBase,
	usePropagationStop,
	useDataBinding,
} from "castmate-ui-core"
import { ref, useModel } from "vue"
import LightColorWheel from "./LightColorWheel.vue"
import LightTemperatureSlider from "./LightTemperatureSlider.vue"
import LightBrightnessSlider from "./LightBrightnessSlider.vue"
import PButton from "primevue/button"
import PTabView from "primevue/tabview"
import PTabPanel from "primevue/tabpanel"

const props = defineProps<
	{
		modelValue: LightColor | undefined
		schema: SchemaLightcolor
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

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

const stopPropagation = usePropagationStop()

function onClick(ev: MouseEvent) {
	toggle()
	stopPropagation(ev)
	ev.preventDefault()
}
</script>

<style scoped>
.light-color-container {
	cursor: pointer;
	user-select: none;

	display: flex;
	flex-direction: row;
}

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
