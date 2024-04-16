<template>
	<div>
		<div class="text-centered">Philips Hue Bridge</div>
		<div class="flex flex-column align-items-center justify-content-center">
			<div class="my-3">
				Press the button on the hue hub, then click Pair Hub to automatically connect CastMate to philips hue.
			</div>
			<p-button :loading="syncing" @click="doSearch">{{ buttonText }}</p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useIpcCaller } from "castmate-ui-core"
import { computed, ref } from "vue"
import PButton from "primevue/button"

const findHueBridge = useIpcCaller<() => any>("philips-hue", "findHueBridge")

const syncing = ref(false)
const foundHub = ref(false)

const buttonText = computed(() => {
	if (syncing.value) {
		return "Searching for Hub..."
	}

	if (foundHub.value) {
		return "Hub Paired!"
	}

	return "Pair Hub"
})

async function doSearch() {
	syncing.value = true
	foundHub.value = false
	foundHub.value = await findHueBridge()
	syncing.value = false
}
</script>
