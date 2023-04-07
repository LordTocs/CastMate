<template>
	<v-dialog v-model="dialog" @keydown.esc="cancel" max-width="50vw">
		<v-card>
			<v-toolbar dense flat>
				<v-toolbar-title
					class="text-body-2 font-weight-bold grey--text"
				>
					{{ title || "Edit Channel Point Reward" }}
				</v-toolbar-title>
			</v-toolbar>
			<v-card-text>
				<reward-editor v-model="rewardEdit" v-model:valid="valid" />
			</v-card-text>
			<v-card-actions class="pt-3">
				<v-spacer></v-spacer>
				<v-btn
					color="grey"
					text
					class="body-2 font-weight-bold"
					@click.native="cancel"
				>
					Cancel
				</v-btn>
				<v-btn
					color="primary"
					class="body-2 font-weight-bold"
					v-if="showSave"
					@click.native="save"
					:active="valid"
				>
					Save
				</v-btn>
				<v-btn
					color="primary"
					class="body-2 font-weight-bold"
					v-if="showCreate"
					@click.native="create"
					:active="valid"
				>
					Create
				</v-btn>
				<v-btn
					color="red"
					class="body-2 font-weight-bold"
					v-if="showDelete"
					@click.native="deleteMe"
				>
					Delete
				</v-btn>
			</v-card-actions>
			<v-snackbar v-model="errorSnack" color="error">
				{{ errorMessage }}
			</v-snackbar>
		</v-card>
	</v-dialog>
</template>

<script>
import RewardEditor from "./RewardEditor.vue"
import _cloneDeep from "lodash/cloneDeep"
import { trackAnalytic } from "../../utils/analytics.js"
import { mapIpcs } from "../../utils/ipcMap"

export default {
	components: { RewardEditor },
	props: {
		reward: {},
		title: {},
		showSave: { type: Boolean, default: () => true },
		showDelete: { type: Boolean, default: () => true },
		showCreate: { type: Boolean, default: () => false },
	},
	data() {
		return {
			rewardEdit: {},
			dialog: false,
			valid: false,
			errorSnack: false,
			errorMessage: null,
		}
	},
	methods: {
		...mapIpcs("twitch", ["createReward", "updateReward", "deleteReward"]),
		open() {
			this.rewardEdit = _cloneDeep(this.reward) || { cost: 1 }
			this.dialog = true
		},
		async save() {
			if (this.reward.title != this.rewardEdit.title) {
				console.log(
					"Detected Rename! ",
					this.reward.title,
					this.rewardEdit.title
				)
				this.$emit("rename", this.rewardEdit.title)
			}
			try {
				await this.updateReward(this.rewardEdit)
			} catch (err) {
				const splitIdx = err.message.indexOf(":")
				let errorText = err.message.substr(splitIdx + 2)
				if (errorText == "UPDATE_CUSTOM_REWARD_DUPLICATE_REWARD") {
					//Special case for this error
					errorText = `A reward with the name "${this.rewardEdit.title}" already exists.`
				}
				this.errorMessage = errorText
				this.errorSnack = true
				return
			}
			trackAnalytic("saveChannelReward", {
				title: this.rewardEdit.title,
				cost: this.rewardEdit.cost,
			})
			this.$emit("updated")
			this.dialog = false
		},
		async deleteMe() {
			await this.deleteReward(this.reward.id)
			trackAnalytic("deleteChannelReward")
			this.$emit("delete")
			this.dialog = false
		},
		cancel() {
			this.dialog = false
		},
		async create() {
			try {
				await this.createReward(this.rewardEdit)
			} catch (err) {
				const splitIdx = err.message.indexOf(":")
				let errorText = err.message.substr(splitIdx + 2)
				if (errorText == "CREATE_CUSTOM_REWARD_DUPLICATE_REWARD") {
					//Special case for this error
					errorText = `A reward with the name "${this.rewardEdit.title}" already exists.`
				}
				this.errorMessage = errorText
				this.errorSnack = true
				return
			}
			this.dialog = false
			this.$emit("created", this.rewardEdit.title)
			trackAnalytic("createChannelReward", {
				title: this.rewardEdit.title,
				cost: this.rewardEdit.cost,
			})
		},
	},
}
</script>

<style></style>
