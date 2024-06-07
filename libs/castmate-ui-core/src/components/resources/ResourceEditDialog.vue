<template>
	<div ref="container" class="dialog-container">
		<component :is="resource?.editDialog" :resourceType="resourceType" :resourceId="resourceId" v-model="config" />
		<div class="flex justify-content-end mt-1">
			<p-button :label="isCreate ? 'Create' : 'Save'" @click="submit"></p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { provideScrollAttachable, useDialogRef, useResourceData } from "../../main"
import PButton from "primevue/button"
import { constructDefault } from "castmate-schema"

const props = defineProps<{}>()

const dialogRef = useDialogRef()

const config = ref<any>()

const container = ref<HTMLElement>()

const resourceType = computed<string | undefined>(() => {
	return dialogRef?.value?.data?.resourceType
})

const resourceId = computed<string | undefined>(() => {
	return dialogRef?.value?.data?.resourceId
})

const resource = useResourceData(resourceType)

const isCreate = computed(() => resourceId.value == null)

provideScrollAttachable(container)

onMounted(async () => {
	if (!dialogRef?.value?.data) throw new Error("Help")

	const dialogData: {
		resourceType: string
		initialConfig: any
	} = dialogRef.value.data

	if (dialogData.initialConfig) {
		config.value = dialogData.initialConfig
	} else if (resource.value?.configSchema) {
		config.value = await constructDefault(resource.value.configSchema)
	}
})

function submit() {
	dialogRef?.value?.close(config.value)
}
</script>

<style scoped>
.dialog-container {
	position: relative;
}
</style>
