<template>
	<v-container fluid>
		<v-row>
			<v-col>
				<v-card height="100%" class="d-flex flex-column">
					<v-card-title> Twitch </v-card-title>
					<v-card-text class="flex-grow-1">
						<v-row>
							<v-col>
								<twitch-account-display />
								<twitch-account-display is-bot />
							</v-col>
							<v-col>
								<strong> Viewers: </strong>
								{{ rootState.twitch.viewers }}
								<br />
								<strong> Followers: </strong>
								{{ rootState.twitch.followers || 0 }} <br />
								<strong> Subscribers: </strong>
								{{ rootState.twitch.subscribers || 0 }} <br />
							</v-col>
						</v-row>
					</v-card-text>
					<v-card-actions v-if="rootState.twitch.isAuthed">
						<v-btn
							:href="`https://www.twitch.tv/dashboard/${rootState.twitch.channelName}`"
							target="_blank"
							variant="outlined"
							size="small"
							prepend-icon="mdi-twitch"
						>
							Twitch Dashboard
						</v-btn>
					</v-card-actions>
				</v-card>
			</v-col>
			<v-col>
				<v-card height="100%" class="d-flex flex-column">
					<v-card-title> OBS </v-card-title>
					<v-card-text
						class="flex-grow-1"
						v-if="!rootState.obs.connected"
					>
						<v-alert dense variant="outlined" type="warning">
							<v-row>
								<v-col class="grow">
									To use OBS features, you must connect over
									the obs-websocket 5 plugin.
								</v-col>
								<v-col class="shrink">
									<v-btn
										color="warning"
										variant="outlined"
										link
										to="/plugins/obs"
										size="small"
									>
										OBS Settings
									</v-btn>
								</v-col>
							</v-row>
						</v-alert>
					</v-card-text>
					<v-card-text class="flex-grow-1" v-else>
						<strong> Streaming: </strong>
						<v-icon
							:color="
								rootState.obs.streaming ? 'blue' : undefined
							"
							>{{
								rootState.obs.streaming
									? "mdi-broadcast"
									: "mdi-broadcast-off"
							}}
						</v-icon>
						<br />
						<strong> Recording: </strong>
						<v-icon
							:color="rootState.obs.recording ? 'red' : undefined"
							>{{
								rootState.obs.recording
									? "mdi-record"
									: "mdi-record"
							}}
						</v-icon>
						<br />
					</v-card-text>
					<v-card-actions>
						<v-btn
							v-if="rootState.obs.connected"
							@click="() => refereshAllBrowsers()"
							variant="outlined"
							prepend-icon="mdi-refresh"
							size="small"
						>
							Refresh Browsers
						</v-btn>
						<v-btn
							v-if="!rootState.obs.connected"
							@click="() => openOBS()"
							variant="outlined"
							prepend-icon="mdi-open-in-app"
							size="small"
						>
							Launch OBS
						</v-btn>
					</v-card-actions>
				</v-card>
			</v-col>
		</v-row>
		<v-row>
			<v-col>
				<plan-card />
			</v-col>
		</v-row>
		<v-row>
			<v-col>
				<active-profiles-card />
			</v-col>
		</v-row>
		<welcome-dialog ref="welcomeDlg" />
	</v-container>
</template>

<script>
import ActiveProfilesCard from "../components/profiles/ActiveProfilesCard.vue"
import WelcomeDialog from "../components/wizard/WelcomeDialog.vue"
import { mapIpcs } from "../utils/ipcMap"
import { trackAnalytic } from "../utils/analytics.js"
import TwitchAccountDisplay from "../components/twitch/TwitchAccountDisplay.vue"
import { mapState } from "pinia"
import { usePluginStore } from "../store/plugins"
import PlanCard from "../components/segments/PlanCard.vue"

export default {
	components: {
		ActiveProfilesCard,
		WelcomeDialog,
		TwitchAccountDisplay,
		PlanCard,
	},
	computed: {
		...mapState(usePluginStore, {
			rootState: "rootState",
		}),
	},
	methods: {
		...mapIpcs("obs", ["refereshAllBrowsers", "openOBS"]),
	},
	mounted() {
		trackAnalytic("accessDashboard")
	},
}
</script>

<style></style>
