<template>
	<v-card>
		<v-card-text class="d-flex flex-row justify-center">
			<div class="mx-4 d-flex flex-column justify-end">
				<p class="text-subtitle-1 text-center">
					<twitch-mini-account-display />
				</p>
				<p class="text-subtitle-2 text-medium-emphasis text-center">
					{{ accountName ?? "Twitch Account" }}
				</p>
			</div>
			<v-divider vertical />
			<div class="mx-4 d-flex flex-column justify-end">
				<p class="text-subtitle-1 text-center">
					<twitch-mini-account-display :is-bot="true" />
				</p>
				<p class="text-subtitle-2 text-medium-emphasis text-center">
					{{ botName ?? "Bot Account" }}
				</p>
			</div>
			<v-divider vertical />
			<div class="mx-4 d-flex flex-column justify-end">
				<p class="text-subtitle-1 text-center">
					{{ streaming ? viewers : "---" }}
				</p>
				<p class="text-subtitle-2 text-medium-emphasis text-center">
					Viewers
				</p>
			</div>
			<v-divider vertical />
			<div class="mx-4 d-flex flex-column justify-end">
				<p class="text-subtitle-1 text-center">
					{{ followers ?? "---" }}
				</p>
				<p class="text-subtitle-2 text-medium-emphasis text-center">
					Followers
				</p>
			</div>
			<v-divider vertical />
			<div class="mx-4 d-flex flex-column justify-end">
				<p class="text-subtitle-1 text-center">
					{{ subscribers ?? "---" }}
				</p>
				<p class="text-subtitle-2 text-medium-emphasis text-center">
					Subscribers
				</p>
			</div>
		</v-card-text>
		<v-card-actions>
			<v-btn
				:href="`https://www.twitch.tv/dashboard/${channelName}`"
				target="_blank"
				prepend-icon="mdi-twitch"
				size="small"
			>
				Twitch Dashboard
			</v-btn>
			<v-btn
				link
				to="/plugins/twitch"
				prepend-icon="mdi-cog"
				size="small"
			>
				Settings
			</v-btn>
		</v-card-actions>
	</v-card>
</template>

<script setup>
import { computed } from "vue"
import { usePluginStore } from "../../store/plugins"
import { useSettingsStore } from "../../store/settings"
import TwitchMiniAccountDisplay from "./TwitchMiniAccountDisplay.vue"

const pluginStore = usePluginStore()
const settingStore = useSettingsStore()

const channelName = computed(() => pluginStore.rootState.twitch.channelName)
const viewers = computed(() => pluginStore.rootState.twitch.viewers)
const followers = computed(() => pluginStore.rootState.twitch.followers)
const subscribers = computed(() => pluginStore.rootState.twitch.subscribers)

const streaming = computed(() => pluginStore.rootState.obs.streaming)

const accountName = computed(() => {
	return pluginStore.rootState.twitch?.channelName
})

const botName = computed(() => {
	return pluginStore.rootState.twitch?.botName
})
</script>
