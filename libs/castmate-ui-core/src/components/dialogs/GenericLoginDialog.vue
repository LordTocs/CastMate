<template>
	<div>
		<form @submit.prevent="login">
			<div class="mt-4">
				<label-floater label="Username" v-slot="labelProps">
					<p-input-text v-model="username" ref="nameInput" autofocus v-bind="labelProps" class="w-full" />
				</label-floater>
			</div>
			<div class="mt-4">
				<label-floater label="Password" v-slot="labelProps" class="mt-4">
					<p-password
						v-model="password"
						ref="nameInput"
						autofocus
						v-bind="labelProps"
						:feedback="false"
						class="w-full password-fix"
					/>
				</label-floater>
			</div>
			<div class="flex justify-content-end mt-1">
				<p-button type="submit" label="Login"></p-button>
			</div>
		</form>
	</div>
</template>

<script setup lang="ts">
import PInputText from "primevue/inputtext"
import PPassword from "primevue/password"
import PButton from "primevue/button"
import LabelFloater from "../data/base-components/LabelFloater.vue"
import { ref } from "vue"
import { useDialogRef } from "../../main"

const username = ref("")
const password = ref("")

const dialogRef = useDialogRef()

function login() {
	dialogRef.value?.close({
		username: username.value,
		password: password.value,
	})
}
</script>

<style scoped>
.password-fix :deep(.p-inputtext) {
	width: 100% !important;
}
</style>
