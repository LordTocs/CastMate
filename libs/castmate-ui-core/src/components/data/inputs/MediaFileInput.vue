<template>
	<div class="p-inputgroup w-full" @mousedown="stopPropagation">
		<div class="p-inputtext" @click="onClick">
			{{ model && model?.length > 0 ? model : "&nbsp;" }}
		</div>
		<p-overlay-panel ref="overlay">
			<p-data-table
				:value="mediaItems"
				v-model:selection="selectedMedia"
				selectionMode="single"
				:paginator="true"
				:rows="5"
				data-key="path"
				v-model:filters="filters"
				:global-filter-fields="['path']"
				@row-select="onSelect"
			>
				<template #header>
					<div class="flex">
						<span class="p-input-icon-left">
							<i class="pi pi-search" />
							<p-input-text autofocus v-model="filters['global'].value" placeholder="Search" />
						</span>
					</div>
				</template>
				<p-column header="Type">
					<template #body="{ data }">
						<i class="mdi mdi-image" v-if="data.image"></i>
						<i class="mdi mdi-volume-high" v-if="data.audio"></i>
						<i class="mdi mdi-filmstrip" v-if="data.video"></i>
					</template>
				</p-column>
				<p-column field="path" header="Path" sortable> </p-column>
			</p-data-table>
		</p-overlay-panel>
	</div>
</template>

<script setup lang="ts">
import { SchemaMediaFile, SchemaBase } from "castmate-schema"
import { computed, ref, useModel } from "vue"
import POverlayPanel from "primevue/overlaypanel"
import PDataTable from "primevue/datatable"
import PInputText from "primevue/inputtext"
import PColumn from "primevue/column"
import { FilterMatchMode } from "primevue/api"
import { stopPropagation, useMediaStore } from "../../../main"
import { MediaMetadata } from "castmate-schema"

const props = defineProps<{
	schema: SchemaMediaFile & SchemaBase
	modelValue: string | undefined
	localPath?: string
}>()

const mediaStore = useMediaStore()
const mediaItems = computed(() =>
	Object.values(mediaStore.media).filter((m) => {
		if (props.schema.image && !m.image) return false
		if (props.schema.sound && !m.audio) return false
		if (props.schema.video && !m.video) return false
		return true
	})
)

const filters = ref({
	global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const model = useModel(props, "modelValue")

const overlay = ref<POverlayPanel | null>(null)

const selectedMedia = computed({
	get() {
		if (!props.modelValue) return undefined
		return mediaStore.media[props.modelValue]
	},
	set(v: MediaMetadata | undefined) {
		model.value = v?.path
	},
})

function onSelect() {
	overlay.value?.hide()
}

function onClick(ev: MouseEvent) {
	overlay.value?.toggle(ev)
}
</script>
