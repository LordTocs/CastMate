<template>
	<p-message v-if="!authed" severity="error" icon="pi pi-times-circle" :pt="{ text: 'flex-grow-1' }">
		<div class="flex flex-row w-full">
			<div class="flex-grow-1 flex flex-column justify-content-center text-center">
				{{ authMessage }}
			</div>
			<p-button class="flex-shrink-0" @click="forceAuth" :loading="doingLogin" severity="danger">
				Sign into {{ category }}
			</p-button>
		</div>
	</p-message>
</template>

<script setup lang="ts">
import { useResource, useResourceIPCCaller } from "castmate-ui-core"
import { AccountState, ResourceData } from "castmate-schema"
import { TwitchAccountConfig } from "castmate-plugin-twitch-shared"

import PAvatar from "primevue/avatar"
import PButton from "primevue/button"
import PMessage from "primevue/message"
import { ref, computed } from "vue"

const props = defineProps<{
	accountId: "channel" | "bot"
	category: string
	authMessage: string
}>()

const account = useResource<ResourceData<TwitchAccountConfig, AccountState>>("TwitchAccount", () => props.accountId)

const authed = computed(() => account.value?.state.authenticated != false)

const login = useResourceIPCCaller<() => boolean>("TwitchAccount", () => props.accountId, "login")

const doingLogin = ref(false)

async function forceAuth() {
	doingLogin.value = true
	try {
		await login()
	} finally {
		doingLogin.value = false
	}
}
</script>
