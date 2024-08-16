<template>
	<div class="container">
		<div class="inner-container" ref="container">
			<p-data-table
				class="flex flex-column"
				:value="lazyViewers"
				data-key="twitch"
				v-model:sort-field="sortField"
				v-model:sort-order="sortOrder"
				scrollable
				style="width: 100%; height: 100%"
				v-if="hasLength"
				:virtual-scroller-options="{
					lazy: true,
					itemSize: 46,
					onLazyLoad,
					numToleratedItems: 10,
					loading: lazyLoading,
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
						<data-view :schema="v.schema" :model-value="data[v.name]" />
					</template>
				</p-column>
			</p-data-table>
		</div>
	</div>
</template>

<script setup lang="ts">
import { VirtualScrollerLazyEvent } from "primevue/virtualscroller"
import PDataTable from "primevue/datatable"
import PColumn from "primevue/column"
import PButton from "primevue/button"
import { useViewerDataStore, DataView, useIpcCaller } from "../../main"
import { computed, ref, onMounted } from "vue"
import { useDialog } from "primevue/usedialog"
import ViewerVariableEditDialog from "./ViewerVariableEditDialog.vue"

import { useElementSize } from "@vueuse/core"

const dialog = useDialog()

const viewerDataStore = useViewerDataStore()

interface ViewerData {
	twitchId: string
	twitchName: string
	[varName: string]: any
}

const container = ref<HTMLElement>()

const { width, height } = useElementSize(container)

const lazyViewers = ref(new Array<ViewerData>())

const getNumRows = useIpcCaller<() => number>("viewer-data", "getNumRows")

onMounted(async () => {
	lazyViewers.value.length = await getNumRows()
	hasLength.value = true
	console.log("Viewer Rows Set", lazyViewers.value.length)
})

const hasLength = ref(false)
const lazyLoading = ref(false)

const sortField = ref<string>()
const sortOrder = ref<number>()

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
			if (!options) {
				return
			}

			console.log("CREATE!", options.data)

			await viewerDataStore.createViewerVariable(options.data)
		},
	})
}

async function onLazyLoad(event: VirtualScrollerLazyEvent) {
	console.log("On Lazy Load!", event)

	lazyLoading.value = true

	const values = await viewerDataStore.queryViewersPaged(
		"twitch",
		event.first,
		event.last,
		sortField.value,
		sortOrder.value
	)

	for (let i = event.first; i < event.last; ++i) {
		lazyViewers.value[i] = values[i - event.first] as ViewerData
	}

	console.log("Viewers", values)

	lazyLoading.value = false
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
