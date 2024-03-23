<template>
	<component
		v-if="widgetComponent"
		:is="widgetComponent"
		:size="widgetConfig.size"
		:position="widgetConfig.position"
		:config="resolvedConfig"
		class="widget"
		:style="widgetStyle"
		ref="widget"
	>
	</component>
</template>

<script setup lang="ts">
import { OverlayWidgetConfig } from "castmate-plugin-overlays-shared"
import { CSSProperties, computed, onMounted, provide } from "vue"
import { useWebsocketBridge } from "./utils/websocket"
import { useOverlayWidgets } from "castmate-overlay-widget-loader"
import { OverlayWidgetComponent, useResolvedWidgetConfig } from "castmate-overlay-core"

const props = defineProps<{
	widgetConfig: OverlayWidgetConfig
}>()

const widgetStyle = computed<CSSProperties>(() => {
	return {
		left: `${props.widgetConfig.position.x}px`,
		top: `${props.widgetConfig.position.y}px`,
		width: `${props.widgetConfig.size.width}px`,
		height: `${props.widgetConfig.size.height}px`,
	}
})

const widgetStore = useOverlayWidgets()

const widgetComponent = computed<OverlayWidgetComponent | undefined>(
	() => widgetStore.getWidget(props.widgetConfig.plugin, props.widgetConfig.widget)?.component
)
//@ts-ignore
const resolvedConfig = useResolvedWidgetConfig(() => props.widgetConfig.config, widgetComponent)

const bridge = useWebsocketBridge()
provide("castmate-bridge", bridge.getBridge(props.widgetConfig.id))

onMounted(() => {
	console.log(props.widgetConfig, widgetComponent)
})
</script>

<style scoped>
.widget {
	position: absolute;
}
</style>
