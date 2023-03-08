<template>
	<v-card class="spellcast-card py-3">
		<div class="d-flex flex-row justify-center align-center text-h3 my-4">
			<spell-cast-logo />
		</div>
		<div class="d-flex flex-row" style="margin: 0 100px">
			<div class="spellcast-text flex-grow-1 text-center">
				<div class="my-4" v-if="!isInstalled">
					<p style="font-size: 3em; margin: 0 0.25em">
						Earn Bits with triggers.
					</p>
					<v-btn @click="startInstall" class="mx-1">
						Install SpellCast Extension
					</v-btn>
				</div>
				<div
					v-else-if="!isActive && needsConfig"
					class="d-flex flex-row justify-center align-center"
				>
					<v-progress-circular
						indeterminate
						color="white"
						:size="100"
						:width="15"
					/>
				</div>
				<div class="my-4" v-else-if="!isActive && !needsConfig">
					<div class="text-center my-2 text-h4">
						The extension is not currently active on your channel.
						Activate?
					</div>
					<v-btn
						@click="activeExtension(1)"
						class="mx-1"
						variant="outlined"
						size="x-large"
						:loading="activatingInProgress[0]"
					>
						As Component 1
					</v-btn>
					<v-btn
						@click="activeExtension(2)"
						class="mx-1"
						variant="outlined"
						size="x-large"
						:loading="activatingInProgress[1]"
					>
						As Component 2
					</v-btn>
				</div>
			</div>
			<div class="">
				<div class="perspective">
					<img
						style="width: 25vw"
						src="../../assets/spellcast.png"
						class="glow"
					/>
				</div>
			</div>
		</div>
	</v-card>
</template>

<script setup>
import { shell } from "electron"
import { computed, ref, watch, onMounted, onUnmounted } from "vue"
import { usePluginStore } from "../../store/plugins"
import { useIpc } from "../../utils/ipcMap"
import SpellCastLogo from "./SpellCastLogo.vue"

const checkExtensionStatus = useIpc("spellcast", "checkExtensionStatus")
const pokeSpellCastForConfig = useIpc("spellcast", "pokeSpellCastForConfig")
const doActivateExtension = useIpc("spellcast", "activateExtension")

const pluginStore = usePluginStore()

const isActive = computed(() => pluginStore.rootState.spellcast.extensionActive)
const isInstalled = computed(
	() => pluginStore.rootState.spellcast.extensionInstalled
)
const needsConfig = computed(
	() => pluginStore.rootState.spellcast.extensionRequiresConfig
)

onMounted(async () => {
	if (!isActive.value) {
		checkExtensionStatus()
	}
})

watch(isActive, () => {
	if (isActive.value) {
		stopPolling()
	}
})

onUnmounted(() => {
	stopPolling()
})

const polling = ref(false)
let pollingInterval = null
function startPolling() {
	if (polling.value) {
		return
	}

	polling.value = true
	pollingInterval = setInterval(async () => {
		if (isInstalled.value && needsConfig.value) {
			//Not sure how we got here, but we need to send a request to
			await pokeSpellCastForConfig()
		}
		checkExtensionStatus()
	}, 3 * 1000)
}

function stopPolling() {
	if (!polling.value) return

	polling.value = false
	clearInterval(pollingInterval)
	pollingInterval = null
}

function startInstall() {
	shell.openExternal(
		"https://dashboard.twitch.tv/extensions/d6rcoml9cel8i3y7amoqjsqtstwtun"
	)
	startPolling()
}

const activatingInProgress = ref([false, false])
async function activeExtension(slot) {
	startPolling()
	activatingInProgress.value[slot - 1] = true
	await doActivateExtension(String(slot))
}
</script>

<style scoped>
.spellcast-card {
	background: radial-gradient(
		circle,
		rgba(3, 115, 230, 1) 0%,
		rgba(0, 8, 33, 1) 100%
	);
}

.spellcast-text {
	color: white;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
		sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
	font-weight: 900;
}

.glow {
	filter: drop-shadow(0 0 0.85rem #0dbf75);
}

.perspective {
	perspective: 1024px;
}

.perspective > img {
	transform: rotate3D(0, 1, 0, -15deg);
}
</style>
