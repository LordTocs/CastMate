<template>
	<v-card>
		<v-card-text v-if="discordhooks.length > 0">
			<v-list>
				<v-list-item
					v-for="hook in discordhooks"
					:key="hook.id"
					:title="hook.config.name"
				>
					<template #append>
						<v-btn
							icon="mdi-delete"
							size="x-small"
							variant="flat"
							class="mx-1"
							@click="deleteHook(hook.id)"
						/>
						<v-btn
							icon="mdi-pencil"
							size="x-small"
							variant="flat"
							class="mx-1"
							@click="editHook(hook.id)"
						/>
					</template>
				</v-list-item>
			</v-list>
		</v-card-text>
		<v-card-text class="d-flex flex-row align-center justify-center" v-else>
			<p class="text-subtitle-1">
				Add a discord webhook to allow CastMate to send messages to that
				channel.
			</p>
		</v-card-text>
		<v-card-actions>
			<v-btn @click="create" color="primary">Add Discord Webhook</v-btn>
		</v-card-actions>
	</v-card>
	<confirm-dialog ref="deleteDlg" />
	<discord-hook-dialog
		ref="editDlg"
		title="Edit Discord WebHook"
		@ok="doEdit"
	/>
	<discord-hook-dialog
		ref="createDlg"
		title="Add Discord Webhook"
		@ok="doCreate"
	/>
</template>

<script setup>
import ConfirmDialog from "../dialogs/ConfirmDialog.vue"
import { useResourceArray, useResourceFunctions } from "../../utils/resources"
import { ref } from "vue"
import DiscordHookDialog from "../dialogs/DiscordHookDialog.vue"

const discordhooks = useResourceArray("discordhook")
const discordhookResource = useResourceFunctions("discordhook")

const deleteDlg = ref(null)
async function deleteHook(id) {
	if (
		await deleteDlg.value.open(
			"Confirm",
			"Are you sure you want to delete this Discord Hook?"
		)
	) {
		discordhookResource.delete(id)
	}
}

const editDlg = ref(null)
const editId = ref(null)
function editHook(id) {
	editId.value = id
	editDlg.value.open(id)
}

async function doEdit(config) {
	await discordhookResource.setConfig(editId.value, config)
}

const createDlg = ref(null)
function create() {
	createDlg.value.open(null)
}

async function doCreate(config) {
	await discordhookResource.create(config)
}
</script>
