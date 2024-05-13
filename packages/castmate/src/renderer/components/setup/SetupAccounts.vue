<template>
	<div>
		<h1 class="text-center mb-0">
			<i class="mdi mdi-twitch twitch-purple"></i>Setup Twitch <migration-check-box :checked="ready" />
		</h1>
		<p class="m-0 mb-4 text-center">
			Sign into <i><b>BOTH</b></i> the channel account and the bot account.<br />
			<span class="p-text-secondary text-sm">
				If you don't have a bot account. Just sign in with your channel account twice.
			</span>
		</p>
		<div class="flex-grow-1 flex flex-row justify-content-center align-items-center gap-4 account-box">
			<div class="flex flex-column align-items-center gap-1">
				<h3 class="my-0">Channel Account</h3>
				<span class="my-0 text-300">Sign into your main channel account here.</span>
				<account-widget account-type="TwitchAccount" account-id="channel" />
			</div>
			<div class="flex flex-column align-items-center gap-1">
				<h3 class="my-0">Bot Account</h3>
				<span class="my-0 text-300">This account is used to send chat messages.</span>
				<account-widget account-type="TwitchAccount" account-id="bot" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { TwitchAccountConfig } from "castmate-plugin-twitch-shared"
import { AccountState, ResourceData } from "castmate-schema"

import { AccountWidget, useResourceArray, useResourceStore } from "castmate-ui-core"
import { computed, onMounted, useModel, watch } from "vue"
import MigrationCheckBox from "../migration/MigrationCheckBox.vue"

const resourceStore = useResourceStore()
const twitchAccounts = useResourceArray<ResourceData<TwitchAccountConfig, AccountState>>("TwitchAccount")

const props = defineProps<{
	ready: boolean
}>()

const ready = useModel(props, "ready")

const readyComputed = computed(() => {
	for (const account of twitchAccounts.value) {
		if (!account.state.authenticated) return false
	}
	return true
})

onMounted(() => {
	watch(
		readyComputed,
		() => {
			ready.value = readyComputed.value
		},
		{ immediate: true }
	)
})
</script>
