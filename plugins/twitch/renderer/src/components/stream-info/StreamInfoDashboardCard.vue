<template>
	<div class="flex flex-column flex-grow-1">
		<data-input v-model="editValue" :schema="StreamInfoSchema" local-path="streamInfo" />
		<div class="flex flex-row">
			<div class="flex-grow-1"></div>
			<p-button @click="save" :loading="updatingInfo" size="small" class="mt-1">Save</p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { MainPageCard, DataInput } from "castmate-ui-core"
import { useCategoryStore } from "../../util/category"
import PButton from "primevue/button"
import { onMounted, ref, watch, watchEffect } from "vue"
import { StreamInfo, StreamInfoSchema } from "castmate-plugin-twitch-shared"
import { useToast } from "primevue/usetoast"

const categoryStore = useCategoryStore()

const editValue = ref<StreamInfo>({
	title: undefined,
	category: undefined,
	tags: [],
})

const updatingInfo = ref(false)

const toast = useToast()

async function save() {
	updatingInfo.value = true
	try {
		await categoryStore.setStreamInfo(editValue.value)
		toast.add({ severity: "success", summary: "Updated Twitch Info", life: 1000 })
	} catch (err) {
		toast.add({ severity: "error", summary: "Failed Update", life: 5000 })
	} finally {
		updatingInfo.value = false
	}
}

onMounted(() => {
	watchEffect(() => (editValue.value = { ...categoryStore.activeStreamInfo }))
})
</script>
