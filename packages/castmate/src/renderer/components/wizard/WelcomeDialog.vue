<template>
	<v-dialog persistent v-model="dialog" @keydown.esc="cancel">
		<v-card width="85vw">
			<p class="text-center text-h2 py-4" v-if="stage == 'welcome'">
				Welcome to CastMate!
			</p>
			<v-card-title class="text-center" v-if="stage == 'twitch'">
				<h1>
					Sign Into
					<img src="../../assets/twitchLogo.png" class="twitchLogo" />
				</h1>
			</v-card-title>
			<v-card-title class="text-center" v-if="stage == 'obs'">
				<h1>
					Configure OBS Websocket
					<img src="../../assets/obsws_logo.png" class="obsWSLogo" />
				</h1>
			</v-card-title>
			<v-card-title class="text-center" v-if="stage == 'done'">
				<h1>You're ready to start creating with CastMate!</h1>
			</v-card-title>
			<v-card-text v-if="stage == 'welcome'">
				<p class="text-h5 text-center">
					Thank you for downloading CastMate!
				</p>
				<div class="d-flex flex-row justify-center my-4">
					<img
						src="../../assets/icons/icon.png"
						style="width: 300px; height: auto; border-radius: 10px"
					/>
				</div>
				<v-card-actions>
					<v-spacer />
					<v-btn
						size="x-large"
						variant="outlined"
						color="primary"
						@click="moveNext"
					>
						Get Started
					</v-btn>
					<v-spacer />
				</v-card-actions>
			</v-card-text>
			<v-card-text v-if="stage == 'twitch'">
				<span class="text-h5">
					CastMate needs you to sign into twitch.
				</span>
				<br />
				<span class="text-h6">
					Sign into your channel account and optionally a chat bot
					account.
				</span>
				<twitch />
			</v-card-text>
			<v-card-text v-if="stage == 'obs'">
				<span class="text-h5"
					>You need to connect CastMate to OBS.</span
				>
				<br />
				<span class="text-h6">
					CastMate connects via OBS Websocket 5.0+.
				</span>
				<br />
				<span class="text-h6">
					OBS Websocket 5.0 comes pre-install in OBS v28 and above! If
					you're running OBS v27 and below you'll need to install
					<a
						href="https://github.com/obsproject/obs-websocket/releases/tag/5.0.1"
						target="_blank"
					>
						OBS Websocket 5.0
					</a>
				</span>
				<hr class="my-4" />
				<div class="my-3">
					<span class="text-h6">
						How to Connect CastMate to OBS:
					</span>
				</div>
				<v-row>
					<v-col class="text-center">
						<p style="margin-bottom: 0.5rem">
							Go to the Tools -> obs-websocket Settings
						</p>
						<img
							src="../../assets/websocketSettings.png"
							width="230"
						/>
					</v-col>
					<v-col class="text-center">
						<p style="margin-bottom: 0.5rem">
							Make sure "Enable WebSocket server" is checked. Then
							click Show Connect Info.
						</p>
						<img src="../../assets/websocket.png" width="577" />
					</v-col>
					<v-col class="text-center">
						<p style="margin-bottom: 0.5rem">
							Click the copy button next to server password, then
							paste it into CastMate below.
						</p>
						<img
							src="../../assets/websocketpassword.png"
							width="353"
						/>
					</v-col>
				</v-row>
				<hr class="my-4" />
				<span class="text-h6"> Enter Your OBS Websocket Settings </span>
				<br />
				<span>
					Match the port and password you set in OBS. Leave hostname
					as "localhost" unless you know what you're doing!
				</span>
				<obs-settings />
			</v-card-text>
			<v-card-text v-if="stage == 'done'">
				<span class="text-h5">
					CastMate uses "Triggers" to run automations based on viewer
					activities. Triggers are grouped together in "Profiles".
					Profiles can be set to automatically enable and disable the
					whole group of triggers. To get you started, we've created
					the main profile for you.
				</span>
				<v-row>
					<v-col>
						<p class="text-h5 text-center my-5">
							For a full tutorial see the YouTube Video!
							<br />
							<br />
						</p>
						<p class="text-center">
							<a
								href="https://www.youtube.com/embed/3I_Kg5fgVxA?start=358"
								class="thumblink"
								target="_blank"
								style="
									background-image: url('https://img.youtube.com/vi/3I_Kg5fgVxA/0.jpg');
								"
							>
							</a>
						</p>
					</v-col>
					<v-col>
						<p class="text-h5 text-center my-5">
							Check out
							<a href="https://www.spellcast.gg/" target="_blank"
								>SpellCast</a
							>
							<br />
							Earn bits from CastMate Triggers!
							<a href="https://www.spellcast.gg/" target="_blank"
								><img
									class="glow"
									style="margin-top: 1rem"
									src="../../assets/spellcast.png"
							/></a>
						</p>
					</v-col>
				</v-row>
			</v-card-text>
			<v-card-actions v-if="stage != 'welcome' && stage != 'done'">
				<v-btn small @click="moveNext"> Skip </v-btn>
				<v-spacer />
				<v-btn
					color="primary"
					variant="outlined"
					:disabled="!ready"
					@click="moveNext"
				>
					Next
				</v-btn>
			</v-card-actions>
			<v-card-actions v-if="stage == 'done'">
				<v-spacer />
				<v-btn
					size="x-large"
					tag="a"
					href="https://discord.gg/txt4DUzYJM"
					target="_blank"
					color="#5865F2"
					class="mx-5"
					variant="outlined"
				>
					<v-icon> mdi-discord </v-icon> Discord
				</v-btn>
				<v-btn
					x-large
					color="primary"
					variant="outlined"
					@click="finish"
					size="x-large"
				>
					Get Creating
				</v-btn>
				<v-spacer />
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import Twitch from "../plugins/twitch.vue"
import ObsSettings from "./ObsSettings.vue"
import { isFirstRun } from "../../utils/firstRun"
import { mapIpcs } from "../../utils/ipcMap"
import { mapState } from "pinia"
import { usePluginStore } from "../../store/plugins"
import { usePathStore } from "../../store/paths"
export default {
	components: { Twitch, ObsSettings },
	data() {
		return {
			dialog: false,
			stage: "welcome",
		}
	},
	computed: {
		...mapState(usePathStore, {
			userFolder: "userFolder",
		}),
		...mapState(usePluginStore, {
			rootState: "rootState",
		}),
		signedIn() {
			return !!this.rootState.twitch.channelName
		},
		obsConnected() {
			return this.rootState.obs.connected
		},
		ready() {
			return (
				this.stage == "welcome" ||
				(this.stage == "twitch" && this.signedIn) ||
				(this.stage == "obs" && this.obsConnected)
			)
		},
	},
	methods: {
		...mapIpcs("io", ["getProfile", "createProfile"]),
		open() {
			this.dialog = true
		},
		async createMainProfile() {
			if (!(await this.getProfile("Main"))) {
				await this.createProfile("Main")
			}
		},
		moveNext() {
			if (this.stage == "welcome") {
				this.stage = "twitch"
				return
			}
			if (this.stage == "twitch") {
				this.stage = "obs"
				return
			}
			if (this.stage == "obs") {
				this.stage = "done"
				this.createMainProfile()
				return
			}
		},
		cancel() {
			this.dialog = false
		},
		finish() {
			this.dialog = false
			this.$router.push("/profiles/Main")
		},
	},
	async mounted() {
		if (await isFirstRun(this.userFolder)) {
			this.open()
		}
	},
}
</script>

<style scoped>
.twitchLogo {
	height: 1em;
	display: inline-block;
	position: relative;
	bottom: -0.275em;
}

.glow {
	filter: drop-shadow(0 0 0.85rem #0dbf75);
}

.obsWSLogo {
	height: 1em;
	display: inline-block;
}

.thumblink {
	width: 560px;
	height: 315px;
	display: inline-block;

	background-position: center;
	background-size: cover;
}
</style>
