<template>
	<flex-scroller class="flex-grow-1">
		<data-input
			v-if="selectedWidgetIndex != null && selectedWidgetInfo != null"
			v-model="model.widgets[selectedWidgetIndex].config"
			:schema="selectedWidgetInfo.component.widget.config"
		/>
	</flex-scroller>
</template>

<script setup lang="ts">
import { useOverlayWidgets } from "castmate-overlay-widget-loader"
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { FlexScroller, useDocumentPath, DataInput, useDocumentSelection } from "castmate-ui-core"
import { computed, onMounted, useModel, watch } from "vue"

const props = defineProps<{
	modelValue: OverlayConfig
}>()

const model = useModel(props, "modelValue")

const documentPath = useDocumentPath()

const widgetSelection = useDocumentSelection(documentPath)

const selectedWidgetId = computed(() => {
	if (widgetSelection.value.length > 1 || widgetSelection.value.length == 0) return undefined
	return widgetSelection.value[0]
})

const widgets = useOverlayWidgets()

const selectedWidgetIndex = computed(() => {
	if (!selectedWidgetId.value) return

	return props.modelValue.widgets.findIndex((w) => w.id == selectedWidgetId.value)
})

const selectedWidgetInfo = computed(() => {
	if (selectedWidgetIndex.value === undefined) return undefined

	const widget = props.modelValue.widgets[selectedWidgetIndex.value]

	return widgets.getWidget(widget.plugin, widget.widget)
})
</script>
