<template>
	<v-container fluid>
		<v-row>
			<v-col>
				<div class="d-flex flex-row justify-center">
					<twitch-dash-card />
					<obs-dash-card class="ml-3" />
				</div>
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
import TwitchDashCard from "../components/twitch/TwitchDashCard.vue"
import ObsDashCard from "../components/obs/ObsDashCard.vue"

export default {
	components: {
		ActiveProfilesCard,
		WelcomeDialog,
		TwitchAccountDisplay,
		PlanCard,
		TwitchDashCard,
		ObsDashCard,
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
