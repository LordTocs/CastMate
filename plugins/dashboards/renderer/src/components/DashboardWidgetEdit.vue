<template>
	<div class="widget-edit widget-handle" :style="widgetStyle" :class="{ selected: isSelected }">
		{{ modelValue.config }}
	</div>
</template>

<script setup lang="ts">
import { DashboardWidget } from "castmate-plugin-dashboards-shared"
import { DashboardWidgetView } from "../dashboard-types"
import { computed, CSSProperties } from "vue"

const props = defineProps<{
	modelValue: DashboardWidget
	view: DashboardWidgetView
	selectedIds: string[]
}>()

const widgetStyle = computed<CSSProperties>(() => {
	return {
		"--column-size": `${props.modelValue.size.width}`,
		"--row-size": `${props.modelValue.size.height}`,
	}
})

const isSelected = computed(() => {
	return props.selectedIds.includes(props.modelValue.id)
})
</script>

<style scoped>
.widget-edit {
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	right: 0;
	background-color: green;
	box-sizing: border-box;

	border: 2px solid var(--surface-b);

	border-radius: var(--border-radius);
}

.selected {
	border: 2px solid white;
}

.widget-handle {
	cursor: grab;
}
</style>
