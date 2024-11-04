<template>
	<div class="dashboard-label" :style="labelStyle">
		<span class="label-span"> {{ props.config.label }} </span>
	</div>
</template>

<script setup lang="ts">
import * as chromatism from "chromatism2"
import { Color } from "castmate-schema"
import { declareWidgetOptions, useCallDashboardRPC, useCastMateBridge, useIsEditor } from "castmate-dashboard-core"
import { computed, CSSProperties, onMounted, ref, watch } from "vue"
import { DashboardWidgetSize } from "castmate-plugin-dashboards-shared"

defineOptions({
	widget: declareWidgetOptions({
		id: "label",
		name: "Label",
		description: "A label!",
		icon: "mdi mdi-cursor-text",
		defaultSize: { width: 4, height: 1 },
		config: {
			type: Object,
			properties: {
				label: { type: String, required: true, name: "Label Text", template: true },
				color: { type: Color, name: "Background Color", template: true },
			},
		},
	}),
})

const props = defineProps<{
	config: { color: Color; label: string }
	size: DashboardWidgetSize
}>()

const labelStyle = computed<CSSProperties>(() => {
	return {
		"--color": props.config.color,
	}
})
</script>

<style scoped>
.dashboard-label {
	container: label / size;

	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;

	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	text-align: center;

	background-color: var(--color);
}

.label-span {
	font-family: Impact;
	font-size: 33cqh;
	-webkit-text-stroke-color: black;
	-webkit-text-stroke-width: 1px;
}
</style>
