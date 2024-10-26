<template>
	<div
		class="section-edit"
		:class="{ selected: isSelected }"
		:style="{ '--column-count': model.columns ?? 4, '--column-width': `${56}px` }"
	>
		<div class="section-header">
			<div class="section-handle">
				<i class="mdi mdi-drag" style="font-size: 2.5rem; line-height: 2.5rem" />
			</div>
			<!-- <div class="flex flex-row flex-grow-1 align-items-center" @mousedown="stopPropagation">
				<span class="segment-name">
					<p-input-text v-model="model.name" />
				</span>
			</div> -->
			<!-- <p-button @click="addWidget(1, 1)"> Add 1x1 </p-button>
			<p-button @click="addWidget(2, 2)"> Add 2x1 </p-button> -->

			<p-button icon="mdi mdi-plus" @click="popAddMenu" class="extra-small-button" size="small" />
			<p-menu :model="addMenuItems" ref="addMenu" :popup="true" />
		</div>

		<grid-document-data-collection
			v-model="model.widgets"
			v-model:view="view.widgets"
			local-path="widgets"
			data-type="dashboard-widget"
			:column-count="model.columns ?? 4"
			:row-height="56"
			handle-class="widget-handle"
			:data-component="DashboardWidgetEdit"
			class="flex-grow-1 section-grid"
		>
		</grid-document-data-collection>
	</div>
</template>

<script setup lang="ts">
import { DashboardSection, DashboardWidget } from "castmate-plugin-dashboards-shared"
import { DashboardSectionView, DashboardWidgetView } from "../dashboard-types"
import { computed, ComputedRef, inject, ref, useModel } from "vue"

import PMenu from "primevue/menu"
import type { MenuItem } from "primevue/menuitem"
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import { stopPropagation, GridDocumentDataCollection } from "castmate-ui-core"

import { DashboardWidgetInfo, useDashboardWidgets } from "castmate-dashboard-widget-loader"

import DashboardWidgetEdit from "./DashboardWidgetEdit.vue"

import { nanoid } from "nanoid/non-secure"
import { constructDefault } from "castmate-schema"
import { config } from "process"

const props = defineProps<{
	modelValue: DashboardSection
	view: DashboardSectionView
	selectedIds: string[]
}>()

const pageSize = inject<ComputedRef<{ width: number; height: number }>>(
	"pageSize",
	computed(() => ({ width: 0, height: 0 }))
)

const view = useModel(props, "view")
const model = useModel(props, "modelValue")

const dashboardWidgets = useDashboardWidgets()

const addMenu = ref<PMenu>()
const addMenuItems = computed<MenuItem[]>(() => {
	return dashboardWidgets.widgets.map((w) => {
		return {
			label: w.component.widget.name,
			icon: w.component.widget.icon,
			command() {
				addWidget(w)
			},
		}
	})
})

async function createNewWidget(widget: DashboardWidgetInfo): Promise<[DashboardWidget, DashboardWidgetView]> {
	const id = nanoid()

	const config = await constructDefault(widget.component.widget.config)

	return [
		{
			id,
			plugin: widget.plugin,
			widget: widget.component.widget.id,
			size: {
				width: widget.component.widget.defaultSize.width,
				height: widget.component.widget.defaultSize.height,
			},
			config,
		},
		{
			id,
		},
	]
}

async function addWidget(widget: DashboardWidgetInfo) {
	const [data, viewdata] = await createNewWidget(widget)

	model.value.widgets.push(data)
	view.value.widgets.push(viewdata)
}

function popAddMenu(ev: MouseEvent) {
	addMenu.value?.toggle(ev)
}

const isSelected = computed(() => {
	return props.selectedIds.includes(props.modelValue.id)
})
</script>

<style scoped>
.section-edit {
	min-width: 10rem;
	min-height: 10rem;

	border: 2px solid var(--surface-b);
	border-radius: var(--border-radius);
	background-color: var(--surface-a);

	height: 100%;

	display: flex;
	flex-direction: column;
}

.section-header {
	display: flex;
	flex-direction: row;
	align-items: center;

	gap: 1rem;
	padding: 0.25rem 0;

	background-color: var(--surface-c);
	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);
}

.section-grid {
	width: calc(var(--column-count) * var(--column-width));
}

.selected {
	border: 2px solid white;
}
</style>
