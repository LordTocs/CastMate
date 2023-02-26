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
		}
	},
	methods: {
		...mapIpcs("twitch", ["createReward", "updateReward", "deleteReward"]),
		open() {
			this.rewardEdit = _cloneDeep(this.reward) || {}
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
			await this.updateReward(this.rewardEdit)
			trackAnalytic("saveChannelReward", {
				title: this.rewardEdit.title,
				cost: this.rewardEdit.cost
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
			await this.createReward(this.rewardEdit)
			this.dialog = false
			this.$emit("created", this.rewardEdit.title)
			trackAnalytic("createChannelReward", {
				title: this.rewardEdit.title,
				cost: this.rewardEdit.cost
			})
		},
	},
}
</script>

<style></style>
