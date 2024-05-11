<template>
	<div class="migration-dialog">
		<div class="text-center">
			<h1 class="mb-0">CastMate 0.5 is <i>Finally</i> Here!</h1>
			<h3 class="p-text-secondary mt-0" v-if="!migratedProfiles">
				We need to update your existing CastMate data.
			</h3>
		</div>
		<div v-if="!backupCreated" class="flex flex-row justify-content-center align-items-center py-5">
			<p-button :loading="migratingSettings" size="large" @click="doBackup">Back Up and Begin Updating</p-button>
		</div>
		<div v-else-if="migratedSettings && !migratedProfiles">
			<div class="flex flex-row gap-4">
				<div class="flex-grow-1 flex flex-column">
					<h1 class="text-center">
						<i class="mdi mdi-twitch twitch-purple"></i>Twitch
						<migration-check-box :checked="areAccountsConnected" />
					</h1>
					<p class="m-0 text-center">
						Sign into <i><b>BOTH</b></i> the channel account and the bot account.<br />
						<span class="p-text-secondary text-sm">
							If you don't have a bot account. Just sign in with your channel account twice.
						</span>
					</p>
					<div class="flex-grow-1 flex flex-row justify-content-center align-items-center gap-4 account-box">
						<div class="flex flex-column align-items-center gap-1">
							<h3 class="my-0">Channel Account</h3>
							<span class="my-0 text-300">Sign into your main channel account here.</span>
							<account-widget account-type="TwitchAccount" account-id="channel" />
						</div>
						<div class="flex flex-column align-items-center gap-1">
							<h3 class="my-0">Bot Account</h3>
							<span class="my-0 text-300">This account is used to send chat messages.</span>
							<account-widget account-type="TwitchAccount" account-id="bot" />
						</div>
					</div>
					<div class="flex flex-row px-2"></div>
				</div>
				<div class="flex-grow-1 flex flex-column">
					<h1 class="text-center">
						<i class="obsi obsi-obs obs-blue"></i>OBS <migration-check-box :checked="isObsConnected" />
					</h1>
					<p class="m-0 text-center">
						Connect to OBS<br />
						<span class="p-text-secondary text-sm">
							CastMate needs OBS open to properly update id values.
						</span>
					</p>
					<data-input v-model="obsConfig" :schema="obsConfigSchema"></data-input>
					<div class="flex flex-row justify-content-center px-2">
						<p-button @click="updateObsSettings"> Save </p-button>
					</div>
				</div>
			</div>
			<div class="flex flex-row justify-content-center">
				<p-button :loading="migratingProfiles" :disabled="!canMigrateProfiles" @click="doMigrate" size="large">
					Migrate!
				</p-button>
			</div>
		</div>
		<div v-else-if="migratedProfiles">
			<h2 class="text-center">Your data has been updated to work with version 0.5!</h2>
			<!--todo: Migration Video Here!-->
			<div class="flex flex-row justify-content-center">
				<p-button size="large" @click="doDone">Go To Castmate!</p-button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { declareSchema } from "castmate-schema"
import {
	AccountWidget,
	DataInput,
	useDialogRef,
	useIpcCaller,
	useIpcMessage,
	useResourceArray,
	useResourceStore,
} from "castmate-ui-core"
import { computed, ref, watch } from "vue"

import PButton from "primevue/button"
import { OBSConnectionConfig, OBSConnectionState } from "castmate-plugin-obs-shared"
import { ResourceData } from "castmate-schema"
import { SchemaType } from "castmate-schema"

import MigrationCheckBox from "./MigrationCheckBox.vue"
import { TwitchAccountConfig } from "castmate-plugin-twitch-shared"
import { AccountState } from "castmate-schema"

const beginMigration = useIpcCaller<() => any>("oldMigration", "beginMigrate")
const finishMigration = useIpcCaller<() => any>("oldMigration", "finishMigrate")

useIpcMessage("oldMigration", "migrateSettingsComplete", () => {
	console.log("Migration of Settings Complete")
	migratedSettings.value = true
})

useIpcMessage("oldMigration", "migrateProfilesComplete", () => {
	console.log("Migration of Profiles Complete")
	migratedProfiles.value = true
})

const creatingBackup = ref(false)
const backupCreated = ref(false)
const migratedSettings = ref(false)
const migratingSettings = ref(false)
const migratingProfiles = ref(false)
const migratedProfiles = ref(false)

const obsConfigSchema = declareSchema({
	type: Object,
	properties: {
		host: { type: String, name: "Hostname", required: true, default: "127.0.0.1" },
		port: { type: Number, name: "Port", required: true, default: 4455 },
		password: { type: String, name: "Password" },
	},
})

const obsConfig = ref<SchemaType<typeof obsConfigSchema>>({
	host: "localhost",
	port: 4455,
	password: undefined,
})

async function doBackup() {
	await beginMigration()
	backupCreated.value = true
	migratingSettings.value = true
}

const obsConnections = useResourceArray<ResourceData<OBSConnectionConfig, OBSConnectionState>>("OBSConnection")

watch(migratedSettings, () => {
	if (!migratedSettings.value) return

	//Settings have been migrated, actually get the OBS values now.

	const mainObs = obsConnections.value[0] //In migration it's safe to assume there's only one OBS connection

	obsConfig.value = {
		host: mainObs.config.host,
		port: mainObs.config.port,
		password: mainObs.config.password,
	}
})

const isObsConnected = computed(() => {
	return obsConnections.value[0]?.state.connected ?? false
})

const resourceStore = useResourceStore()
const twitchAccounts = useResourceArray<ResourceData<TwitchAccountConfig, AccountState>>("TwitchAccount")

const areAccountsConnected = computed(() => {
	for (const account of twitchAccounts.value) {
		if (!account.state.authenticated) return false
	}
	return true
})

const canMigrateProfiles = computed(() => {
	return isObsConnected.value && areAccountsConnected.value
})

function updateObsSettings() {
	resourceStore.applyResourceConfig("OBSConnection", obsConnections.value[0].id, obsConfig.value)
}

async function doMigrate() {
	await finishMigration()
	migratingProfiles.value = true
}

const dialogRef = useDialogRef()

function doDone() {
	dialogRef.value?.close("Success")
}
</script>

<style scoped>
.account-box {
	padding: 0.5rem;
	margin: 0.5rem;
	border: solid 1px var(--surface-border);
	border-radius: var(--border-radius);
}
</style>
