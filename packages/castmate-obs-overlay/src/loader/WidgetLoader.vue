<template>
	<component
		v-if="widgetComponent && widgetConfig.visible && resolvedConfig != null"
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
import { useOverlayWidget } from "castmate-overlay-widget-loader"
import { useResolvedSchema } from "castmate-satellite-ui-core"

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

const widgetComponent = useOverlayWidget(() => props.widgetConfig)
const resolvedConfig = useResolvedSchema(
	() => props.widgetConfig.config,
	() => widgetComponent.value?.widget.config
)

onMounted(() => {
	console.log(props.widgetConfig, widgetComponent)
})
</script>

<style scoped>
.widget {
	position: absolute;
}
</style>
