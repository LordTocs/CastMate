<template>
	<template v-if="signedIn">
		<v-avatar :size="size">
			<img :src="profilePictureUrl" :alt="accountName" />
		</v-avatar>
	</template>
	<template v-else>
		<v-btn
			@click="signIn"
			variant="outlined"
			size="small"
			:color="!props.isBot ? 'error' : undefined"
		>
			{{ !props.isBot ? "Required" : undefined }} Sign In
		</v-btn>
	</template>
</template>

<script setup>
import { computed, ref } from "vue"
import { usePluginStore } from "../../store/plugins"
import { useIpc } from "../../utils/ipcMap.js"

const props = defineProps({
	isBot: { type: Boolean, default: false },
	size: {},
})

const pluginStore = usePluginStore()

const accountName = computed(() => {
	if (props.isBot) return pluginStore.rootState.twitch?.botName
	else return pluginStore.rootState.twitch?.channelName
})

const signedIn = computed(() => {
	return !!accountName.value
})

const profilePictureUrl = computed(() => {
	if (props.isBot) return pluginStore.rootState.twitch?.botProfileUrl
	else return pluginStore.rootState.twitch?.channelProfileUrl
})

const signingIn = ref(false)

const doChannelAuth = useIpc("twitch", "doChannelReauth")
const doBotAuth = useIpc("twitch", "doBotAuth")

async function signIn() {
	try {
		signingIn.value = true
		if (props.isBot) return await doBotAuth()
		else return await doChannelAuth()
	} catch (err) {
	} finally {
		signingIn.value = false
	}
}
</script>
