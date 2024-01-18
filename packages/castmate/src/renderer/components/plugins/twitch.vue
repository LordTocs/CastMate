<template>
	<v-row>
		<v-col>
			<v-card>
				<v-card-title> Twitch Channel Account </v-card-title>
				<v-card-subtitle>
					Twitch Account of your Channel
				</v-card-subtitle>
				<v-card-text>
					<span v-if="channelName" class="text-h5">
						<v-avatar>
							<img
								:src="rootState.twitch.channelProfileUrl"
								:alt="channelName"
							/>
						</v-avatar>
						{{ channelName }}
					</span>
					<span v-else> Not Signed In </span>
				</v-card-text>
				<v-card-actions>
					<template v-if="!channelName">
						<v-btn
							color="#9147FF"
							:loading="channelWorking"
							@click="startChannelAuth"
						>
							Sign In
						</v-btn>
						<v-btn
							color="#9147FF"
							:loading="channelWorking"
							@click="startMinChannelAuth"
						>
							Sign In (Fewer Permissions)
						</v-btn>
					</template>
					<template v-else>
						<v-btn
							color="#5B4B72"
							:loading="channelWorking"
							@click="startChannelAuth"
						>
							Sign In Again
						</v-btn>
						<v-btn
							color="#5B4B72"
							:loading="channelWorking"
							@click="startMinChannelAuth"
						>
							Sign In Again (Fewer Permissions)
						</v-btn>
					</template>
				</v-card-actions>
			</v-card>
		</v-col>
		<v-col>
			<v-card>
				<v-card-title> Twitch Bot Account (Optional) </v-card-title>
				<v-card-subtitle>
					Twitch Account of your Chat Bot
				</v-card-subtitle>
				<v-card-text>
					<span v-if="botName" class="text-h5">
						<v-avatar>
							<img
								:src="rootState.twitch.botProfileUrl"
								:alt="botName"
							/>
						</v-avatar>
						{{ botName }}
					</span>
					<span v-else> Not Signed In </span>
				</v-card-text>
				<v-card-actions>
					<v-btn
						color="#9147FF"
						:loading="botWorking"
						@click="startBotAuth"
						v-if="!botName"
					>
						Sign In
					</v-btn>
					<v-btn
						color="#5B4B72"
						:loading="botWorking"
						@click="startBotAuth"
						v-else
					>
						Sign In Again
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-col>
	</v-row>
</template>

<script>
import { mapState } from "pinia"
import { usePluginStore } from "../../store/plugins"
import { mapIpcs } from "../../utils/ipcMap"

export default {
	data() {
		return {
			channelWorking: false,
			botWorking: false,
		}
	},
	computed: {
		...mapState(usePluginStore, {
			rootState: "rootState",
		}),
		botName() {
			return this.rootState.twitch?.botName
		},
		channelName() {
			return this.rootState.twitch?.channelName
		},
	},
	methods: {
		...mapIpcs("twitch", [
			"doChannelAuth",
			"doMinChannelAuth",
			"doBotAuth",
		]),
		async startChannelAuth() {
			this.channelWorking = true
			if (await this.doChannelAuth()) {
				this.hasChannelAuthed = true
			}
			this.channelWorking = false
		},
		async startMinChannelAuth() {
			this.channelWorking = true
			if (await this.doMinChannelAuth()) {
				this.hasChannelAuthed = true
			}
			this.channelWorking = false
		},
		async startBotAuth() {
			this.botWorking = true
			if (await this.doBotAuth()) {
				this.hasBotAuthed = true
			}
			this.botWorking = false
		},
	},
}
</script>

<style>
.v-avatar > img {
	height: calc(var(--v-avatar-height) + 0px);
}
</style>
