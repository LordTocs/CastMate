<template>
<div class="d-flex flex-row align-center my-1">
    <template v-if="signedIn">
        <v-avatar >
            <img :src="profilePictureUrl" :alt="accountName" />
        </v-avatar>
        <div class="d-flex flex-column justify-center mx-3">
            <label class="v-label my-0">
                {{ props.isBot ? "Bot" : "Channel" }}
            </label>
            <p class="text-h6">
                {{ accountName }}
            </p>
        </div>
    </template>
    <template v-else>
        <v-avatar color="info">
            <v-icon icon="mdi-account-circle"></v-icon>
        </v-avatar>
        <div class="d-flex flex-column justify-center mx-3">
            <p class="text-subtitle-2 text-medium-emphasis my-0">
                {{ props.isBot ? "Bot" : "Channel" }}
            </p>
            <v-btn @click="signIn" variant="outlined" size="small" :color="!props.isBot ? 'error' : undefined">
                {{ !props.isBot ? 'Required' : undefined }} Sign In
            </v-btn>
        </div>
    </template>
</div>
</template>


<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useIpc } from "../../utils/ipcMap.js"

const props = defineProps({
    isBot: { type: Boolean, default: false },
})

const store = useStore();

const accountName = computed(() => {
    if (props.isBot)
        return store.getters['ipc/stateLookup'].twitch?.botName
    else
        return store.getters['ipc/stateLookup'].twitch?.channelName
})

const signedIn = computed(() => {
    return !!accountName.value
})

const profilePictureUrl = computed(() => {
    if (props.isBot)
        return store.getters['ipc/stateLookup'].twitch?.botProfileUrl
    else
        return store.getters['ipc/stateLookup'].twitch?.channelProfileUrl
})


const signingIn = ref(false)

const doChannelAuth = useIpc("twitch", "doChannelAuth")
const doBotAuth = useIpc("twitch", "doBotAuth")

async function signIn() {
    try {
        signingIn.value = true
        if (props.isBot)
            return await doBotAuth()
        else
            return await doChannelAuth()
    }
    catch(err) {

    }
    finally {
        signingIn.value = false
    }
    
}
</script>

<style>
.v-avatar>img {
  height: calc(var(--v-avatar-height) + 0px);
}
</style>