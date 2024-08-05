<template>
	<div class="container">
		<p-data-table
			:value="memberUsers"
			v-model:filters="filters"
			style="width: 100%; max-height: 100%"
			scrollable
			data-key="id"
			sort-field="displayName"
		>
			<template #header>
				<div class="flex">
					<div style="width: 20rem">
						<twitch-viewer-input
							v-model="memberAdder"
							:schema="{ type: TwitchViewer, name: 'Add Member' }"
						/>
					</div>
					<div class="flex-grow-1"></div>
					<!-- <span class="p-input-icon-left">
						<i class="pi pi-search" />
						<p-input-text v-model="filters['global'].value" placeholder="Search" />
					</span> -->
				</div>
			</template>

			<p-column header="Viewer" field="id">
				<template #body="{ data }: { data: TwitchViewerDisplayData }">
					<img class="twitch-avatar" :src="data.profilePicture" />
					<span :style="{ color: data.color }"> {{ data.displayName }}</span>
				</template>
			</p-column>

			<p-column class="column-fit-width">
				<template #body="{ data }: { data: TwitchViewerDisplayData }">
					<div class="flex flex-row">
						<p-button icon="mdi mdi-delete" severity="error" text @click="tryDelete(data)"></p-button>
					</div>
				</template>
			</p-column>
		</p-data-table>
	</div>
</template>

<script setup lang="ts">
import PDataTable from "primevue/datatable"
import PColumn from "primevue/column"
import PButton from "primevue/button"
import PInputText from "primevue/inputtext"
import { FilterMatchMode } from "primevue/api"
import { computed, onMounted, ref, watch, watchEffect } from "vue"
import { useResource, useResourceIPCCaller } from "castmate-ui-core"
import { ResourceData } from "castmate-schema"
import {
	TwitchViewer,
	TwitchViewerDisplayData,
	TwitchViewerGroupConfig,
	TwitchViewerUnresolved,
} from "castmate-plugin-twitch-shared"
import { useViewerStore } from "../../util/viewer"
import { useConfirm } from "primevue/useconfirm"
import TwitchViewerInput from "../viewer/TwitchViewerInput.vue"

const props = defineProps<{
	pageData: { resourceId: string }
}>()

const filters = ref({
	global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const resource = useResource<ResourceData<TwitchViewerGroupConfig>>(
	"CustomTwitchViewerGroup",
	() => props.pageData.resourceId
)

const memberUsers = ref<TwitchViewerDisplayData[]>([])

const viewerStore = useViewerStore()

async function queryMembers() {
	memberUsers.value = await viewerStore.getUsersByIds([...(resource.value?.config?.userIds ?? [])])
}

const removeId = useResourceIPCCaller<(userId: string) => any>(
	"CustomTwitchViewerGroup",
	() => props.pageData.resourceId,
	"remove"
)

const addId = useResourceIPCCaller<(userId: string) => any>(
	"CustomTwitchViewerGroup",
	() => props.pageData.resourceId,
	"add"
)

const confirm = useConfirm()

function tryDelete(user: TwitchViewerDisplayData) {
	confirm.require({
		header: `Delete ${user.displayName}?`,
		message: `Are you sure you want to delete ${user.id}`,
		icon: "mdi mdi-delete",
		accept() {
			removeId(user.id)
		},
	})
}

const memberAdder = computed<TwitchViewerUnresolved | undefined>({
	get() {
		return undefined
	},
	set(v) {
		if (v != null) {
			addId(v)
		}
	},
})

onMounted(() => {
	queryMembers()
})

watch(
	() => resource.value?.config?.userIds,
	() => {
		queryMembers()
	},
	{ deep: true }
)
</script>

<style scoped>
.twitch-avatar {
	display: inline-block;
	height: 1em;
	margin-right: 0.5em;
}
</style>
