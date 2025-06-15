<template>
	<div class="widget-edit widget-handle" :style="widgetStyle" :class="{ selected: isSelected }">
		<component
			v-if="widgetComponent && resolvedConfig != null"
			:is="widgetComponent"
			:config="resolvedConfig"
			:size="model.size"
		/>
	</div>
</template>

<script setup lang="ts">
import { DashboardWidget } from "castmate-plugin-dashboards-shared"
import { DashboardWidgetView } from "../dashboard-types"
import { computed, CSSProperties, provide, useModel } from "vue"
import { useDashboardWidgets } from "castmate-dashboard-widget-loader"
import { useRemoteDashboardConfig } from "../config/dashboard-config"
import { provideSatelliteWidgetBridge } from "castmate-satellite-ui-core"

const props = defineProps<{
	modelValue: DashboardWidget
	view: DashboardWidgetView
	selectedIds: string[]
}>()

const model = useModel(props, "modelValue")

const dashboardWidgets = useDashboardWidgets()

const resolvedConfig = useRemoteDashboardConfig(() => props.modelValue)

provideSatelliteWidgetBridge(() => model.value.id)

const widgetComponent = computed(
	() => dashboardWidgets.getWidget(props.modelValue.plugin, props.modelValue.widget)?.component
)

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
	box-sizing: border-box;

	border: 2px solid var(--surface-b);

	border-radius: var(--border-radius);

	overflow: hidden;
}

.selected {
	border: 2px solid white;
}

.widget-handle {
	cursor: grab;
}
</style>
