<template>
	<div class="dashboard-editor">
		<!-- <div class="dashboard-header flex flex-row align-items-center px-2 py-2">
			<div>
				<p-button @click="openShareDialog">Edit Share</p-button>
			</div>
		</div> -->
		<div class="dashboard-body flex flex-row flex-grow-1">
			<scrolling-tab-body
				v-model:scroll-x="view.scrollX"
				v-model:scroll-y="view.scrollY"
				inner-class="px-2"
				class="flex-grow-1"
			>
				<document-data-collection
					style="gap: 1rem"
					v-model="model.pages"
					v-model:view="view.pages"
					local-path="pages"
					data-type="dashboard-page"
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

				<dashboard-permissions-edit v-model="model.remoteTwitchIds" />
				<div style="height: 15rem"></div>
			</scrolling-tab-body>
			<div class="dashboard-properties">
				<dashboard-properties-edit v-model="model" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { DashboardConfig, DashboardPage } from "castmate-plugin-dashboards-shared"
import { DashboardPageView, DashboardView } from "../dashboard-types"
import DashboardPropertiesEdit from "./DashboardPropertiesEdit.vue"
import { ScrollingTabBody, DocumentDataCollection } from "castmate-ui-core"
import { computed, useModel } from "vue"

import PButton from "primevue/button"

import DashboardPageEdit from "./DashboardPageEdit.vue"
import { nanoid } from "nanoid/non-secure"
import { useDialog } from "primevue/usedialog"
import DashboardPermissionsEdit from "./DashboardPermissionsEdit.vue"

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

<style scoped>
.dashboard-editor {
	display: flex;
	flex-direction: column;
}

.dashboard-header {
	display: flex;
	flex-direction: row;
	background-color: var(--surface-b);
}

.dashboard-properties {
	background-color: var(--surface-b);
	user-select: none;
	width: 350px;
	display: flex;
	flex-direction: column;
}
</style>
