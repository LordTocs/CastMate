<template>
	<div class="w-full">
		<widget-gradient-edit v-model="gradient" />
		<widget-background-settings-edit v-model="model" />
	</div>
</template>

<script setup lang="ts">
import { WidgetBackgroundGradient, WidgetGradientStyle } from "castmate-plugin-overlays-shared"
import WidgetBackgroundSettingsEdit from "./WidgetBackgroundSettingsEdit.vue"
import WidgetGradientEdit from "../gradient/WidgetGradientEdit.vue"
import { useDefaultableModel } from "castmate-ui-core"

const model = defineModel<WidgetBackgroundGradient>()

const makeGradient = (): WidgetGradientStyle => {
	return {
		stops: [
			{ color: "#FFFFFF", position: 0 },
			{ color: "#000000", position: 1 },
		],
		gradientType: "linear",
		angle: 90,
	}
}

const makeDefault = (): WidgetBackgroundGradient => {
	return {
		gradient: makeGradient(),
	}
}

const gradient = useDefaultableModel(model, "gradient", makeGradient(), makeDefault)
</script>

<style scoped></style>
