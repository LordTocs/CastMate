<template>
	<div class="page-container" :class="{ selected: isSelected }">
		<div class="page-header">
			<div class="page-handle">
				<i class="mdi mdi-drag" style="font-size: 2.5rem; line-height: 2.5rem" />
			</div>
			<div class="flex flex-row flex-grow-1 align-items-center" @mousedown="stopPropagation">
				<span class="segment-name">
					<p-input-text v-model="model.name" />
				</span>
			</div>
			<p-button @click="addSection"> Add Section </p-button>
		</div>
		<div class="page-content">
			<dashboard-section-edit
				v-for="(section, i) of model.sections"
				:key="section.id"
				v-model="model.sections[i]"
				v-model:view="view.sections[i]"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { DashboardPage, DashboardSection } from "castmate-plugin-dashboards-shared"
import { DashboardPageView, DashboardSectionView } from "../dashboard-types"
import { computed, useModel } from "vue"

import DashboardSectionEdit from "./DashboardSectionEdit.vue"

import { stopPropagation } from "castmate-ui-core"

import PInputText from "primevue/inputtext"
import PButton from "primevue/button"

import { nanoid } from "nanoid/non-secure"

const props = defineProps<{
	modelValue: DashboardPage
	view: DashboardPageView
	selectedIds: string[]
}>()

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

const isSelected = computed(() => {
	return props.selectedIds.includes(model.value.id)
})

function createNewSection(): [DashboardSection, DashboardSectionView] {
	const id = nanoid()
	return [
		{
			id,
			name: "",
			widgets: [],
		},
		{
			id,
			widgets: [],
		},
	]
}

function addSection(ev: MouseEvent) {
	const [data, viewdata] = createNewSection()

	model.value.sections.push(data)
	view.value.sections.push(viewdata)

	stopPropagation(ev)
}
</script>

<style scoped>
.page-container {
	border: 2px solid var(--surface-b);
	border-radius: var(--border-radius);
	background-color: var(--surface-a);

	display: flex;
	flex-direction: column;
}

.page-container.selected {
	border: 2px solid white;
}

.page-header {
	display: flex;
	flex-direction: row;
	gap: 1rem;
	padding: 0.25rem 0;

	background-color: var(--surface-c);
	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);
}

.page-content {
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	aspect-ratio: 1.77777;
	background-color: var(--surface-a);
	padding: 1rem;
}
</style>
