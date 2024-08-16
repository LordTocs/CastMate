<template>
	<div class="container">
		<p-data-table
			:value="lazyViewers"
			v-model:sort-field="sortField"
			v-model:sort-order="sortOrder"
			:virtual-scroller-options="{
				onLazyLoad,
			}"
		>
			<p-column field="twitch_name" header="Viewer"></p-column>

			<p-column v-for="v in viewerDataStore.variables.values()" :key="v.name" :header="v.name">
				<template #body="{ data }">
					<data-view :schema="v.schema" :model-value="data" />
				</template>
			</p-column>
		</p-data-table>
	</div>
</template>

<script setup lang="ts">
import { VirtualScrollerLazyEvent } from "primevue/virtualscroller"
import PDataTable from "primevue/datatable"
import PColumn from "primevue/column"
import { useViewerDataStore, DataView } from "../../main"
import { computed, ref } from "vue"

const viewerDataStore = useViewerDataStore()

interface ViewerData {
	twitchId: string
	twitchName: string
	[varName: string]: any
}

const lazyViewers = ref(new Array<ViewerData>())

const sortField = ref<string>()
const sortOrder = ref<number>()

function onLazyLoad(event: VirtualScrollerLazyEvent) {
	console.log("On Lazy Load!", event)

	viewerDataStore.queryViewersPaged("twitch", event.first, event.last, sortField.value, sortOrder.value)
}
</script>

<style scoped></style>
