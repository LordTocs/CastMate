<template>
	<div>
		<form @submit.prevent="create">
			<div class="p-inputgroup w-full">
				<span class="p-float-label">
					<p-input-text id="l" v-model="name" ref="nameInput" autofocus />
					<label for="l"> {{ props.label }} </label>
				</span>
			</div>
			<div class="flex justify-content-end mt-1">
				<p-button type="submit" label="Create"></p-button>
			</div>
		</form>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, inject, type Ref, onMounted } from "vue"
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import { useDialogRef } from "../../util/dialog-helper" //Wtf primevue

const dialogRef = useDialogRef()

const props = withDefaults(
	defineProps<{
		label?: string
	}>(),
	{
		label: "Name",
	}
)

const name = ref<string>("")

function create() {
	dialogRef?.value?.close(name.value)
}

/*
const name = computed({
	get() {
		return (dialogRef?.value?.data as { name: string })?.name ?? ""
	},
	set(v) {
		if (!dialogRef || !dialogRef.value) {
			return
		}

		dialogRef.value.data = { name: v }
	},
})
*/
</script>

<style scoped></style>
