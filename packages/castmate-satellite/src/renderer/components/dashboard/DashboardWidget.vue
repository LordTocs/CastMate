<template>
	<div
		class="dashboard-widget-container"
		:style="{ '--row-size': widget.size.height, '--column-size': widget.size.width }"
	>
		<div class="widget-wrap">
			<component
				v-if="widgetInfo && resolvedConfig"
				:is="widgetInfo.component"
				:config="resolvedConfig"
				:size="widget.size"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { DashboardWidget } from "castmate-plugin-dashboards-shared"

import { useDashboardWidgets } from "castmate-dashboard-widget-loader"
import { computed, provide } from "vue"
import { CastMateBridgeImplementation, useResolvedWidgetConfig } from "castmate-dashboard-core"
import { useDashboardRTCBridge } from "../../util/dashboard-rtc-bridge"

const props = defineProps<{
	page: string
	section: string
	widget: DashboardWidget
}>()

const dashboardWidgets = useDashboardWidgets()

const bridge = useDashboardRTCBridge()

provide<CastMateBridgeImplementation>(
	"castmate-bridge",
	bridge.getBridge(
		() => props.page,
		() => props.section,
		() => props.widget.id
	)
)

const widgetInfo = computed(() => {
	return dashboardWidgets.getWidget(props.widget.plugin, props.widget.widget)
})

const resolvedConfig = useResolvedWidgetConfig(() => props.widget.config, widgetInfo.value?.component)
</script>

<style scoped>
.dashboard-widget-container {
	height: calc(var(--row-size) * var(--row-height) + max(0, var(--row-size) - 1) * var(--grid-gap));
	grid-row: span var(--row-size);
	grid-column: span var(--column-size);

	position: relative;
}

.widget-wrap {
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	right: 0;

	border: 2px solid var(--surface-b);
	border-radius: var(--border-radius);
	overflow: hidden;
}
</style>
