<template>
	<div>
		<template v-if="account && account.config.name.length > 0">
			<p-avatar :image="account.config.icon" shape="circle" v-if="account.config.icon" />
			<p-avatar :label="account.config.name[0]" shape="circle" v-else />
			{{ account.config.name }}
		</template>
		<p-button @click="forceAuth" :loading="doingLogin"> Sign In </p-button>
	</div>
</template>

<script setup lang="ts">
import { useResource, useResourceIPCCaller } from "../../resources/resource-store"
import { ResourceData, AccountConfig } from "castmate-schema"
import PButton from "primevue/button"
import PAvatar from "primevue/avatar"
import { ref } from "vue"

const account = useResource<ResourceData<AccountConfig>>(
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
