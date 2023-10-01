<template>
	<div class="flex flex-row align-items-center justify-content-center">
		<template v-if="account && account.state.authenticated">
			<p-avatar :image="account.config.icon" shape="circle" class="mr-2" v-if="account.config.icon" />
			<p-avatar :label="account.config.name[0]" shape="circle" class="mr-2" v-else />
			<span class="mr-2">{{ account.config.name }}</span>
			<p-button @click="forceAuth" :loading="doingLogin" plain text size="small"> Sign In Again </p-button>
		</template>
		<template v-else>
			<p-button @click="forceAuth" :loading="doingLogin"> Sign In </p-button>
		</template>
	</div>
</template>

<script setup lang="ts">
import { useResource, useResourceIPCCaller } from "../../resources/resource-store"
import { ResourceData, AccountConfig, AccountState } from "castmate-schema"
import PButton from "primevue/button"
import PAvatar from "primevue/avatar"
import { ref } from "vue"

const account = useResource<ResourceData<AccountConfig, AccountState>>(
	() => props.accountType,
	() => props.accountId
)

const props = defineProps<{
	accountType: string
	accountId: string
}>()

const login = useResourceIPCCaller<() => boolean>(
	() => props.accountType,
	() => props.accountId,
	"login"
)

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
