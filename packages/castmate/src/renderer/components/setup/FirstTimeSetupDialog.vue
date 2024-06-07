<template>
	<div class="setup-dialog">
		<div class="setup-step" v-if="step == 'twitch'">
			<setup-accounts v-model:ready="ready" />
		</div>
		<div class="setup-step" v-else-if="step == 'obs'">
			<setup-obs v-model:ready="ready" />
		</div>
		<div class="setup-step" v-else-if="step == 'done'">
			<setup-done />
		</div>
		<p-divider />
		<div class="flex flex-row justify-content-center align-items-center gap-1" v-if="step != 'done'">
			<div class="flex-grow-1"></div>
			<p-button @click="moveNextStep" :disabled="!ready"> Next </p-button>
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
import {
	createProfileViewData,
	useDialogRef,
	useDockingStore,
	useResource,
	useResourceArray,
	useResourceStore,
} from "castmate-ui-core"
import { ProfileConfig } from "castmate-schema"
import { ResourceData } from "castmate-schema"

const step = ref("twitch")

const ready = ref(false)

function moveNextStep() {
	if (step.value == "twitch") {
		step.value = "obs"
	} else if (step.value == "obs") {
		step.value = "done"
		ensureMainProfile()
	}
}

const dialogRef = useDialogRef()

const resourceStore = useResourceStore()
const profiles = useResourceArray<ResourceData<ProfileConfig>>("Profile")

const mainProfileId = ref<string>()

const mainProfile = useResource<ResourceData<ProfileConfig>>("Profile", mainProfileId)

async function ensureMainProfile() {
	const mainProfile = profiles.value.find((p) => p.config.name == "Main")

	if (mainProfile) {
		mainProfileId.value = mainProfile.id
		return
	}

	mainProfileId.value = await resourceStore.createResource("Profile", "Main")
}

const dockingStore = useDockingStore()

function openMainProfile() {
	if (!mainProfile.value) return
	dockingStore.openDocument(
		mainProfile.value.id,
		mainProfile.value.config,
		createProfileViewData(mainProfile.value),
		"profile"
	)
}

function done() {
	openMainProfile()
	dialogRef.value?.close()
}
</script>

<style scoped>
.setup-step {
}
</style>
