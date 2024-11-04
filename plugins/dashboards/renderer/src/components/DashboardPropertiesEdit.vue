<template>
	<flex-scroller class="flex-grow-1 dashboard-props">
		<template v-if="widgetModel != null && selectedWidgetInfo != null">
			<data-input v-model="widgetModel.config" :schema="selectedWidgetInfo.component?.widget.config" />
			<dashboard-widget-size-edit v-model="widgetModel.size" />
		</template>
		<template v-else-if="sectionModel != null">
			<dashboard-section-prop-edit v-model="sectionModel" />
		</template>
	</flex-scroller>
</template>

<script setup lang="ts">
import { useDashboardWidgets } from "castmate-dashboard-widget-loader"
import { DashboardConfig } from "castmate-plugin-dashboards-shared"
import { joinDocumentPath, useCompleteDocumentSelection, useDocumentPath, useDocumentSelection } from "castmate-ui-core"
import { computed, useModel } from "vue"
import { DataInput, FlexScroller } from "castmate-ui-core"

import DashboardWidgetSizeEdit from "./DashboardWidgetSizeEdit.vue"
import DashboardSectionPropEdit from "./DashboardSectionPropEdit.vue"

const props = defineProps<{
	modelValue: DashboardConfig
}>()

const selection = useCompleteDocumentSelection()

const model = useModel(props, "modelValue")

const widgetSelection = computed(() => {
	if (!selection.value?.container) return undefined

	const parseRegex = /pages\[([a-zA-Z0-9_\-]+)\].sections\[([a-zA-Z0-9_\-]+)\].widgets/g

	const result = parseRegex.exec(selection.value.container)

	if (!result) return undefined

	return {
		page: result[1],
		section: result[2],
	}
})

const sectionSelection = computed(() => {
	if (!selection.value?.container) return undefined

	const parseRegex = /pages\[([a-zA-Z0-9_\-]+)\].sections$/g

	const result = parseRegex.exec(selection.value.container)

	if (!result) return undefined

	return {
		page: result[1],
	}
})

const sectionModel = computed({
	get() {
		if (selection.value.items.length == 0 || selection.value.items.length > 1) return undefined
		if (!sectionSelection.value) return undefined

		const page = model.value.pages.find((p) => p.id == sectionSelection.value?.page)
		if (!page) return undefined

		const section = page.sections.find((s) => s.id == selection.value.items[0])
		if (!section) return undefined

		return section
	},
	set(v) {
		if (!v) return
		if (selection.value.items.length == 0 || selection.value.items.length > 1) return undefined
		if (!sectionSelection.value) return undefined

		const page = model.value.pages.find((p) => p.id == sectionSelection.value?.page)
		if (!page) return undefined

		const sectionIdx = page.sections.findIndex((s) => s.id == selection.value.items[0])
		if (sectionIdx < 0) return

		page.sections[sectionIdx] = v
	},
})

const widgetModel = computed({
	get() {
		if (selection.value.items.length == 0 || selection.value.items.length > 1) return undefined
		if (!widgetSelection.value) return undefined

		const page = model.value.pages.find((p) => p.id == widgetSelection.value?.page)
		if (!page) return undefined

		const section = page.sections.find((s) => s.id == widgetSelection.value?.section)
		if (!section) return undefined

		const widget = section.widgets.find((w) => w.id == selection.value.items[0])
		if (!widget) return undefined

		return widget
	},
	set(v) {
		if (!v) return
		if (selection.value.items.length == 0 || selection.value.items.length > 1) return undefined
		if (!widgetSelection.value) return

		const page = model.value.pages.find((p) => p.id == widgetSelection.value?.page)
		if (!page) return

		const section = page.sections.find((s) => s.id == widgetSelection.value?.section)
		if (!section) return

		const widgetIdx = section.widgets.findIndex((w) => w.id == selection.value.items[0])
		if (widgetIdx < 0) return

		section.widgets[widgetIdx] = v
	},
})

const dashboardWidgets = useDashboardWidgets()

const selectedWidgetInfo = computed(() => {
	if (widgetModel.value == null) return undefined

	return dashboardWidgets.getWidget(widgetModel.value.plugin, widgetModel.value.widget)
})
</script>

<style scoped>
.dashboard-props {
	min-height: 5rem;
}
</style>
