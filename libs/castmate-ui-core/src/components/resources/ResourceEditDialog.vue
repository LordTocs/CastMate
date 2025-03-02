<template>
	<div ref="container" class="dialog-container">
		<template v-if="config != null">
			<component
				v-if="resource?.editDialog"
				:is="resource.editDialog"
				:resourceType="resourceType"
				:resourceId="resourceId"
				v-model="config"
			/>
			<p-input-group class="mt-5" v-else>
				<p-float-label variant="on">
					<p-input-text id="l" v-model="config" ref="nameInput" autofocus />
					<label for="l"> Name </label>
				</p-float-label>
			</p-input-group>
		</template>
		<div class="flex justify-content-end mt-1">
			<p-button :label="isCreate ? 'Create' : 'Save'" @click="submit"></p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { provideScrollAttachable, useDialogRef, useResourceData } from "../../main"
import PButton from "primevue/button"
import PInputText from "primevue/inputtext"
import { constructDefault } from "castmate-schema"
import PInputGroup from "primevue/inputgroup"
import PFloatLabel from "primevue/floatlabel"

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
