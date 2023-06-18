<template>
	<v-container fluid>
		<v-card>
			<v-card-title> CastMate</v-card-title>
			<v-card-subtitle> v{{ version }} </v-card-subtitle>
			<v-card-text>
				<a href="https://www.castmate.io/" target="_blank">
					CastMate Home Page
				</a>
				<br />
				<a
					href="https://www.github.com/LordTocs/CastMate"
					target="_blank"
				>
					GitHub
				</a>
				<br />
				<a href="https://discord.gg/txt4DUzYJM" target="_blank">
					Discord
				</a>
				<br />
				<br />
				<a
					href="https://github.com/LordTocs/CastMate/blob/main/LICENSE.md"
					target="_blank"
				>
					License
				</a>
				<br />
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn color="primary" @click="$refs.welcomeDlg.open()">
					First Time Setup
				</v-btn>
				<v-btn color="primary" @click="checkForUpdates">
					Check For Updates
				</v-btn>
			</v-card-actions>
		</v-card>
		<welcome-dialog ref="welcomeDlg" />
	</v-container>
</template>

<script>
import { ipcRenderer } from "electron"
import WelcomeDialog from "../components/wizard/WelcomeDialog.vue"
import { mapIpcs } from "../utils/ipcMap"
export default {
	components: { WelcomeDialog },
	data() {
		return {
			version: null,
		}
	},
	methods: {
		...mapIpcs("windowFuncs", ["getVersion"]),
		checkForUpdates() {
			ipcRenderer.invoke("updater.checkForUpdates")
		},
	},
	async mounted() {
		this.version = await this.getVersion()
	},
}
</script>

<style></style>
