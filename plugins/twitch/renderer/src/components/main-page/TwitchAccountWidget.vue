<template>
	<div
		:class="{ 'twitch-authed': authed, 'twitch-no-auth': !authed }"
		class="twitch-account px-2 py-1 flex flex-column align-items-center gap-2"
	>
		<span> <i class="pi pi-times-circle error-icon" v-if="!authed" /> {{ category }}</span>
		<template v-if="account && authed">
			<p-avatar :image="account.config.icon" shape="circle" class="mr-2" v-if="account.config.icon" />
			<p-avatar :label="account.config.name[0]" shape="circle" class="mr-2" v-else />
			<span>{{ account.config.name }}</span>
		</template>
		<template v-else>
			<div class="text-center text-xs flex-grow-1">{{ authMessage }}</div>
			<p-button severity="danger" @click="forceAuth" :loading="doingLogin" size="small">Sign In</p-button>
		</template>
	</div>
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

const authed = computed(() => false) //account.value?.state.authenticated != false)

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

<style scoped>
.twitch-account {
	border-radius: var(--border-radius);
	width: 150px;
}

.twitch-authed {
	/* border: solid 2px var(--surface-border); */
}

.twitch-no-auth {
	color: var(--p-red-500);
	border: solid 2px color-mix(in srgb, var(--p-red-700), transparent 64%);
	background-color: color-mix(in srgb, var(--p-red-500), transparent 84%);
}

.error-icon {
}
</style>
