<template>
    <div v-if="!isObsConnected">
        <span class="text-medium-emphasis mx-2">OBS Not Connected:</span>
        <v-btn @click="openOBS" variant="outlined" prepend-icon="mdi-open-in-app" size="small">
            Launch OBS
        </v-btn>
    </div>
    <template v-else>
        <template v-if="!browserSourceName">
            <span class="mx-2 text-medium-emphasis">OBS Source Not Found: </span>
            <v-btn @click="tryCreateSource" size="small" class="mx-2"> Create Source </v-btn>
        </template>
        <template v-else>
            <span class="mx-2"> <span class="text-medium-emphasis"> OBS Source:</span> {{ browserSourceName }} </span>
        </template>
        <v-btn icon="mdi-refresh" @click="findBrowserSource" size="x-small"/>
    </template>
    <named-item-modal ref="nameModal" :header="`Create Browser Source`" label="Source Name"  @created="createBrowserSource" />
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useSettingsStore } from '../../store/settings';
import { useIpc } from '../../utils/ipcMap';
import NamedItemModal from '../dialogs/NamedItemModal.vue';


const store = useStore()

const settingsStore = useSettingsStore();

const currentScene = computed(() => store.getters['ipc/stateLookup'].obs?.scene)
const isObsConnected = computed(() => store.getters['ipc/stateLookup'].obs?.connected)

const props = defineProps({
    overlay: { },
    overlayId: { type: String }
})

const urlPattern = computed(() => {
    return `http://[\\w]+(:[\\d]+)?[/\\\\]overlays[/\\\\]${props.overlayId}`
})

const findBrowserByUrlPattern = useIpc('obs', 'findBrowserByUrlPattern')
const createNewSource = useIpc('obs', 'createNewSource')

const openOBS = useIpc('obs', 'openOBS');
const getOBSRemoteHost = useIpc('obs', 'getOBSRemoteHost')


const browserSourceName = ref(null);

async function findBrowserSource() {
    const source = await findBrowserByUrlPattern(urlPattern.value);

    browserSourceName.value = source.inputName

    //Validate url
}

watch(isObsConnected, () => {
    if (isObsConnected.value) {
        findBrowserSource();
    }
})

async function createBrowserSource(name) {
    console.log("Creating Source", name)
    const remoteHost = await getOBSRemoteHost();
    const port = settingsStore.settings?.castmate?.port || 85
    const url = `http://${remoteHost}:${port}/overlays/${props.overlayId}`

    await createNewSource('browser_source', name, currentScene.value, {
        width: props.overlay.width,
        height: props.overlay.height,
        url
    })

    browserSourceName.value = name
}

const nameModal = ref(null)
async function tryCreateSource() {
    nameModal.value.open()
}

onMounted(() => {
    if (isObsConnected.value)
        findBrowserSource()
})

</script>