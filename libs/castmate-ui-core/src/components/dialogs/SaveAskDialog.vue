<template>
	<div>
		<form @submit.prevent="saveAndClose">
			<p class="mt-0">{{ name }} has unsaved changes.</p>
			<div class="flex justify-content-end mt-1 gap-1">
				<p-button size="small" text label="Close" @click="close" tabindex="1"></p-button>
				<p-button size="small" text label="Cancel" @click="cancel" tabindex="2"></p-button>
				<p-button
					size="small"
					type="submit"
					label="Save & Close"
					tabindex="0"
					ref="saveButton"
					:autofocus="true"
				></p-button>
			</div>
		</form>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue"
import { useDialogRef } from "../../main"
import PButton from "primevue/button"

const saveButton = ref<InstanceType<typeof PButton> & { $el: HTMLElement }>()

const dialogRef = useDialogRef()

const name = computed(() => dialogRef.value?.data?.name as string | undefined)

onMounted(() => {
	nextTick(() => {
		console.log(saveButton.value?.$el)
		//saveButton.value?.$el?.focus()
	})
})

function saveAndClose() {
	dialogRef.value?.close("saveAndClose")
}

function close() {
	dialogRef.value?.close("close")
}

function cancel() {
	dialogRef.value?.close()
}
</script>
