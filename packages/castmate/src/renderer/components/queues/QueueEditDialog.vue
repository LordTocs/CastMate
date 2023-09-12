<template>
	<div style="padding-top: 1.5rem">
		<form @submit.prevent="create">
			<div class="p-inputgroup w-full pb-3">
				<span class="p-float-label">
					<p-input-text id="l" v-model="name" ref="nameInput" autofocus />
					<label for="l"> Queue Name </label>
				</span>
			</div>
			<div class="p-inputgroup w-full">
				<p-check-box input-id="paused" v-model="paused" binary></p-check-box>
				<label for="paused" class="ml-2"> Pause Execution </label>
			</div>
			<div class="flex justify-content-end mt-1">
				<p-button type="submit" label="Create"></p-button>
			</div>
		</form>
	</div>
</template>

<script setup lang="ts">
import { useDialogRef } from "castmate-ui-core" //Wtf primevue
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import PCheckBox from "primevue/checkbox"
import { ref } from "vue"

const dialogRef = useDialogRef()
const name = ref<string>("")
const paused = ref<boolean>(false)

function create() {
	dialogRef?.value?.close({
		name: name.value,
		paused: paused.value,
	})
}
</script>

<style scoped></style>
