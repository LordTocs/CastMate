<template>
	<dashboard-card style="height: unset; width: 30rem">
		<template #header> <i class="mdi mdi-twitch twitch-purple" /> Stream Info </template>
		<div class="flex flex-column flex-grow-1">
			<data-input v-model="editValue" :schema="StreamInfoSchema" />
			<div class="flex flex-row">
				<div class="flex-grow-1"></div>
				<p-button @click="save" size="small">Save</p-button>
			</div>
		</div>
	</dashboard-card>
</template>

<script setup lang="ts">
import { DashboardCard, DataInput } from "castmate-ui-core"
import { useCategoryStore } from "../../util/category"
import PButton from "primevue/button"
import { onMounted, ref, watch, watchEffect } from "vue"
import { StreamInfo, StreamInfoSchema } from "castmate-plugin-twitch-shared"

const categoryStore = useCategoryStore()

const editValue = ref<StreamInfo>({
	title: undefined,
	category: undefined,
})

function save() {
	categoryStore.setStreamInfo(editValue.value)
}

onMounted(() => {
	watchEffect(() => (editValue.value = { ...categoryStore.activeStreamInfo }))
})
</script>
