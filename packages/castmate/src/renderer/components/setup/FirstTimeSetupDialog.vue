<template>
	<div class="setup-dialog">
		<div class="setup-step" v-if="step == 'twitch'">
			<setup-accounts />
		</div>
		<div class="setup-step" v-else-if="step == 'obs'">
			<setup-obs />
		</div>
		<div class="setup-step" v-else-if="step == 'done'">
			<setup-done />
		</div>
		<p-divider />
		<div class="flex flex-row justify-content-center align-items-center gap-1" v-if="step != 'done'">
			<div class="flex-grow-1"></div>
			<p-button @click="moveNextStep"> Next </p-button>
			<div class="flex-grow-1 flex flex-row justify-content-end w-0">
				<p-button outlined @click="moveNextStep"> Skip </p-button>
			</div>
		</div>
		<div class="flex flex-row justify-content-center align-items-center" v-else>
			<p-button @click="done"> Get Started! </p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import SetupObs from "./SetupObs.vue"
import SetupAccounts from "./SetupAccounts.vue"
import SetupDone from "./SetupDone.vue"
import PButton from "primevue/button"
import PDivider from "primevue/divider"
import { ref } from "vue"
import { useDialogRef } from "castmate-ui-core"

const step = ref("twitch")

function moveNextStep() {
	if (step.value == "twitch") {
		step.value = "obs"
	} else if (step.value == "obs") {
		step.value = "done"
	}
}

const dialogRef = useDialogRef()

function done() {
	dialogRef.value?.close()
}
</script>

<style scoped>
.setup-step {
}
</style>
