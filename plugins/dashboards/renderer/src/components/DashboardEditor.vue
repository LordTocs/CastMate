<template>
	<scrolling-tab-body v-model:scroll-x="view.scrollX" v-model:scroll-y="view.scrollY" inner-class="px-2">
		<div style="height: 2rem" />
		<document-data-collection
			style="gap: 1rem"
			v-model="model.pages"
			v-model:view="view.pages"
			local-path="pages"
			:data-component="DashboardPageEdit"
			handle-class="page-handle"
		>
			<template #header>
				<div class="flex flex-column p-1">
					<div>
						<p-button @click="addNewSegmentStart">Add Page</p-button>
					</div>
				</div>
			</template>
			<template #no-items>
				<div class="flex flex-column align-items-center p-3">
					<p-button @click="addNewSegmentEnd">Add Page</p-button>
				</div>
			</template>
		</document-data-collection>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import { DashboardConfig, DashboardPage } from "castmate-plugin-dashboards-shared"
import { DashboardPageView, DashboardView } from "../dashboard-types"
import { ScrollingTabBody, DocumentDataCollection } from "castmate-ui-core"
import { computed, useModel } from "vue"

import PButton from "primevue/button"

import DashboardPageEdit from "./DashboardPageEdit.vue"
import { nanoid } from "nanoid/non-secure"

const props = defineProps<{
	modelValue: DashboardConfig
	view: DashboardView
}>()

const view = useModel(props, "view")
const model = useModel(props, "modelValue")

function createNewPage(): [DashboardPage, DashboardPageView] {
	const id = nanoid()

	return [
		{
			id,
			name: "",
			sections: [],
		},
		{
			id,
			sections: [],
		},
	]
}

function addNewSegmentEnd() {
	const [segment, viewdata] = createNewPage()
	model.value.pages.push(segment)
	view.value.pages.push(viewdata)
}

function addNewSegmentStart() {
	const [segment, viewdata] = createNewPage()
	model.value.pages.splice(0, 0, segment)
	view.value.pages.splice(0, 0, viewdata)
}
</script>
