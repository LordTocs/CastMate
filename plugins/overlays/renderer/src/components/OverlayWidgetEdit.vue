<template>
	<pan-area-resizable
		v-model:position="model.position"
		v-model:size="model.size"
		:scale-size="zoomScale"
		:show-drag="true"
	>
		<component v-if="widgetComponent" :is="widgetComponent" :config="resolvedConfig" />
	</pan-area-resizable>
</template>

<script setup lang="ts">
import { OverlayWidgetConfig } from "castmate-plugin-overlays-shared"
import { PanArea, PanAreaResizable } from "castmate-ui-core"
import { ComputedRef, computed, inject, markRaw, onMounted, useModel, watch } from "vue"
import { useOverlayWidgets } from "castmate-overlay-widget-loader"
import { useRemoteOverlayConfig } from "../config/overlay-config"

const props = defineProps<{
	modelValue: OverlayWidgetConfig
}>()

const model = useModel(props, "modelValue")

const zoomScale = inject<ComputedRef<number>>(
	"overlay-zoom-scale",
	computed(() => 1)
)

const resolvedConfig = useRemoteOverlayConfig(() => props.modelValue)

const widgetStore = useOverlayWidgets()

const widgetComponent = computed(
	() => widgetStore.getWidget(props.modelValue.plugin, props.modelValue.widget)?.component
)

onMounted(() => {
	console.log("Widget Component", resolvedConfig.value)
	watch(
		resolvedConfig,
		() => {
			console.log("Widget Component", resolvedConfig.value)
		},
		{ immediate: true }
	)
})
</script>

<style scoped></style>
