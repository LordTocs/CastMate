<template>
	<flex-scroller class="flex-grow-1 widget-props">
		<template v-if="selectedWidgetIndex != null && selectedWidgetInfo != null">
			<data-input
				v-model="model.widgets[selectedWidgetIndex].config"
				:schema="selectedWidgetInfo.component.widget.config"
			/>
			<overlay-widget-transform-edit v-model="model.widgets[selectedWidgetIndex]" />
		</template>
	</flex-scroller>
</template>

<script setup lang="ts">
import { useOverlayWidgets } from "castmate-overlay-widget-loader"
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { FlexScroller, DataInput, useDocumentSelection } from "castmate-ui-core"
import { computed, onMounted, useModel, watch } from "vue"
import OverlayWidgetTransformEdit from "./OverlayWidgetTransformEdit.vue"

const props = defineProps<{
	modelValue: OverlayConfig
}>()

const model = useModel(props, "modelValue")

const widgetSelection = useDocumentSelection()

const selectedWidgetId = computed(() => {
	if (widgetSelection.value.length > 1 || widgetSelection.value.length == 0) return undefined
	return widgetSelection.value[0]
})

const widgets = useOverlayWidgets()

const selectedWidgetIndex = computed(() => {
	if (!selectedWidgetId.value) return

	const idx = props.modelValue.widgets.findIndex((w) => w.id == selectedWidgetId.value)
	if (idx < 0) return undefined

	return idx
})

const selectedWidgetInfo = computed(() => {
	if (selectedWidgetIndex.value === undefined) return undefined

	const widget = props.modelValue.widgets[selectedWidgetIndex.value]

	return widgets.getWidget(widget.plugin, widget.widget)
})
</script>

<style scoped>
.widget-props {
	min-height: 5rem;
}
</style>
