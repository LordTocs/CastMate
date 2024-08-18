<template>
	<div class="container">
		<div class="inner-container" ref="container">
			<p-data-table
				class="flex flex-column"
				:value="viewers"
				data-key="twitch"
				v-model:sort-field="sortField"
				v-model:sort-order="sortOrder"
				scrollable
				style="width: 100%; height: 100%"
				:virtual-scroller-options="{
					lazy: true,
					itemSize: 46,
					onLazyLoad,
					numToleratedItems: 10,
					loading,
				}"
			>
				<template #header>
					<div class="flex flex-row">
						<div class="flex-grow-1"></div>
						<p-button @click="createNew">Create Viewer Variable</p-button>
					</div>
				</template>

				<p-column field="twitch_name" header="Viewer"></p-column>

				<p-column v-for="v in viewerDataStore.variables.values()" :key="v.name" :header="v.name">
					<template #body="{ data }">
						<data-view v-if="data" :schema="v.schema" :model-value="data[v.name]" />
					</template>
				</p-column>
			</p-data-table>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	VirtualScrollerLazyEvent,
	VirtualScrollerScrollIndexChangeEvent,
	VirtualScrollerProps,
} from "primevue/virtualscroller"
import PDataTable from "primevue/datatable"
import PColumn from "primevue/column"
import PButton from "primevue/button"
import { useViewerDataStore, DataView, useIpcCaller, useLazyViewerQuery } from "../../main"
import { computed, ref, watch, onMounted, effect } from "vue"
import { useDialog } from "primevue/usedialog"
import ViewerVariableEditDialog from "./ViewerVariableEditDialog.vue"

import { useElementSize } from "@vueuse/core"

const dialog = useDialog()

const viewerDataStore = useViewerDataStore()

const container = ref<HTMLElement>()

const { width, height } = useElementSize(container)

const sortField = ref<string>()
const sortOrder = ref<number>()

const { viewers, updateRange, loading } = useLazyViewerQuery(sortField, sortOrder)

effect(() => {
	for (const v of viewers.value) {
		console.log(v)
	}
})

function createNew() {
	dialog.open(ViewerVariableEditDialog, {
		props: {
			header: "Create Viewer Variable",
			style: {
				width: "25vw",
			},
			modal: true,
		},
		async onClose(options) {
			console.log("Close!", options)
			if (!options?.data) {
				return
			}

			console.log("CREATE!", options.data)

			await viewerDataStore.createViewerVariable(options.data)
		},
	})
}

async function onLazyLoad(event: VirtualScrollerLazyEvent) {
	console.log("On Lazy Load!", event)
	updateRange(event.first, event.last)
}
</script>

<style scoped>
.container {
	position: relative;
}

.inner-container {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	overflow: hidden;
}

.inner-container :deep(.p-datatable-wrapper) {
	flex: 1;
}

.inner-container :deep(.p-virtualscroller) {
	height: 100%;
}
</style>
