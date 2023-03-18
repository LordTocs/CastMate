<template>
	<v-container fluid>
		<v-card>
			<div class="d-flex flex-row align-center my-2 mx-2">
				<v-btn color="primary" @click="addModal.open()" class="mr-3">
					Add Profile
				</v-btn>
				<v-text-field
					v-model="search"
					append-inner-icon="mdi-magnify"
					label="Filter"
					single-line
					hide-details
				/>
			</div>
		</v-card>
		<v-table class="profile-table">
			<thead>
				<tr>
					<th>Mode</th>
					<th colspan="2">Profile</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="profile in filteredProfiles" :key="profile.name">
					<td class="fitwidth">
						<div class="centerfit">
							<toggle-input
								:modelValue="profile.activationMode"
								:schema="{
									toggleIcon: 'mdi-cogs',
									required: true,
								}"
								@update:model-value="
									setActivationMode(profile.name, $event)
								"
								hide-details
							/>
						</div>
					</td>
					<td class="fitwidth">
						<div class="centerfit">
							<v-icon
								v-if="
									queueStore.activeProfiles.includes(
										profile.name
									)
								"
								icon="mdi-check-circle"
								color="success"
							/>
							<v-icon
								v-else
								icon="mdi-close-circle"
								color="rgba(255,255,255,0.5)"
							/>
						</div>
					</td>
					<td
						style="cursor: pointer"
						@click="navToProfile(profile.name)"
					>
						{{ profile.name }}
					</td>
					<td class="fitwidth">
						<v-menu bottom right>
							<template
								v-slot:activator="{ props: activatorProps }"
							>
								<v-btn
									variant="flat"
									size="small"
									icon="mdi-dots-vertical"
									v-bind="activatorProps"
								/>
							</template>
							<v-list>
								<v-list-item
									link
									icon="mdi-rename"
									@click="tryRename(profile.name)"
								>
									<v-list-item-title>
										Rename
									</v-list-item-title>
								</v-list-item>
								<v-list-item link>
									<v-list-item-title
										icon="mdi-delete"
										@click="tryDelete(profile.name)"
									>
										Delete
									</v-list-item-title>
								</v-list-item>
								<v-list-item
									link
									icon="mdi-content-copy"
									@click="tryDuplicate(profile.name)"
								>
									<v-list-item-title>
										Duplicate
									</v-list-item-title>
								</v-list-item>
							</v-list>
						</v-menu>
					</td>
				</tr>
			</tbody>
		</v-table>
		<confirm-dialog ref="deleteDlg" />
		<named-item-confirmation ref="duplicateDlg" />
		<named-item-modal
			ref="addModal"
			:header="`Create New ${name}`"
			label="Name"
			@created="doCreateProfile"
		/>
	</v-container>
</template>

<script setup>
import { useIpc } from "../utils/ipcMap"
import { ref, onMounted, computed } from "vue"
import { useRouter } from "vue-router"
import ToggleInput from "../components/data/types/ToggleInput.vue"

import ConfirmDialog from "../components/dialogs/ConfirmDialog.vue"
import NamedItemConfirmation from "../components/dialogs/NamedItemConfirmation.vue"
import NamedItemModal from "../components/dialogs/NamedItemModal.vue"
import { useQueueStore } from "../store/queues"

const profiles = ref([])
const search = ref("")

const filteredProfiles = computed(() => {
	let profileArray = profiles.value

	if (search.value.length > 0) {
		const searchLowerCase = search.value.toLowerCase()
		profileArray = profileArray.filter((p) =>
			p.name.toLowerCase().includes(searchLowerCase)
		)
	}

	profileArray = profileArray.sort((a, b) => {
		const aName = a.name.toUpperCase()
		const bName = b.name.toUpperCase()

		if (aName < bName) {
			return -1
		}
		if (aName > bName) {
			return 1
		}
		return 0
	})

	return profileArray
})

const queueStore = useQueueStore()

const getProfiles = useIpc("io", "getProfiles")
const createProfile = useIpc("io", "createProfile")
const cloneProfile = useIpc("io", "cloneProfile")
const deleteProfile = useIpc("io", "deleteProfile")
const renameProfile = useIpc("io", "renameProfile")
const setProfileActivationMode = useIpc("io", "setProfileActivationMode")

async function getFiles() {
	profiles.value = await getProfiles()
}
const router = useRouter()

function navToProfile(name) {
	router.push(`/profiles/${name}`)
}

const deleteDlg = ref(null)
const duplicateDlg = ref(null)
const addModal = ref(null)

async function doCreateProfile(name) {
	if (await createProfile(name)) {
		navToProfile(name)
	}
}

async function setActivationMode(name, mode) {
	const profile = profiles.value.find((p) => p.name == name)
	if (profile) {
		await setProfileActivationMode(name, mode)
		profile.activationMode = mode
	}
}

async function tryDuplicate(name) {
	if (
		await duplicateDlg.value.open(
			`Duplicate ${name}?`,
			`New Profile Name`,
			"Duplicate",
			"Cancel"
		)
	) {
		const newName = duplicateDlg.value.name
		if (await cloneProfile(name, newName)) {
			navToProfile(name)
		}
	}
}

async function tryDelete(name) {
	if (
		await deleteDlg.value.open(
			"Confirm",
			`Are you sure you want to delete ${name}?`
		)
	) {
		await deleteProfile(name)
		await getFiles()
	}
}

async function tryRename(name) {
	if (
		await duplicateDlg.value.open(
			`Rename ${name}?`,
			`New Profile Name`,
			"Rename",
			"Cancel"
		)
	) {
		const newName = duplicateDlg.value.name
		await renameProfile(name, newName)
		await getFiles()
	}
}

onMounted(() => {
	getFiles()
})
</script>

<style scoped>
td.fitwidth {
	width: 1px;
	white-space: nowrap;
}

.centerfit {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
}
</style>
