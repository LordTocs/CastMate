<template>
	<div class="flex flex-row align-items-center">
		<c-toggle-button
			on-icon="mdi mdi-blur-linear"
			off-icon="mdi mdi-blur-radial"
			size="small"
			v-model="gradientShape"
			text
		/>
		<widget-gradient-bar-edit class="flex-grow-1" v-model="model" />
		<c-angle-input class="ml-2" v-if="model?.gradientType == 'linear'" v-model="model.angle" />
	</div>
</template>

<script setup lang="ts">
import { WidgetGradientStyle } from "castmate-plugin-overlays-shared"
import WidgetGradientBarEdit from "./WidgetGradientBarEdit.vue"
import { CToggleButton, CAngleInput } from "castmate-ui-core"
import { computed } from "vue"

const props = defineProps<{}>()

const model = defineModel<WidgetGradientStyle>()

const gradientShape = computed<boolean>({
	get() {
		return (model.value?.gradientType ?? "linear") == "linear"
	},
	set(v) {
		const gradientType = v ? "linear" : "radial"

		if (!model.value) {
			model.value = { ...makeDefaultGradient(), gradientType }
		} else {
			model.value.gradientType = gradientType
		}
	},
})

const makeDefaultGradient = () => {
	return {
		gradientType: "linear",
		angle: 0,
		stops: [
			{ color: "#FF0000", position: 0 },
			{ color: "#0000FF", position: 1 },
		],
	} as WidgetGradientStyle
}
</script>

<style scoped></style>
