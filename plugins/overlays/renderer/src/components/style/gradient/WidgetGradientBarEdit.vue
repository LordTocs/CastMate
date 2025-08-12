<template>
	<div class="gradient-bar-edit" ref="gradientEdit">
		<div class="gradient-bar"></div>
		<template v-if="model">
			<widget-gradient-stop-edit
				v-for="(s, i) in model.stops"
				v-model="model.stops[i]"
				:container="gradientEdit"
			/>
		</template>
	</div>
</template>

<script setup lang="ts">
import { getGradientStopCSS, WidgetGradientStyle } from "castmate-plugin-overlays-shared"
import { computed, useTemplateRef } from "vue"

import WidgetGradientStopEdit from "./WidgetGradientStopEdit.vue"

const props = defineProps<{}>()

const model = defineModel<WidgetGradientStyle>()

const gradientStyle = computed(() => {
	if (!model.value) return `linear-gradient(90deg,rgba(0, 0, 0, 1) 0%, rgba(255, 255, 255, 1) 100%)`

	return `linear-gradient(90deg, ${model.value.stops.map((s) => getGradientStopCSS(s)).join(", ")})`
})

const gradientEdit = useTemplateRef("gradientEdit")
</script>

<style scoped>
.gradient-bar-edit {
	--gradient-edit-height: 2rem;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	height: var(--gradient-edit-height);
}
.gradient-bar {
	height: calc(var(--gradient-edit-height) / 2);
	width: 100%;
	border-radius: var(--border-radius);
	background: v-bind(gradientStyle);
	border: 1px solid var(--p-inputtext-border-color);
}
</style>
