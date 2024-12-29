<template>
	<div class="flex-grow-1 flex flex-column justify-content-center align-items-center">
		<h3>Connecting to CastMate</h3>
		<p-progress-spinner />
	</div>
</template>

<script setup lang="ts">
import { usePrimarySatelliteConnection } from "castmate-ui-core"
import PProgressSpinner from "primevue/progressspinner"
import { onMounted, watch } from "vue"
import { usePageStore } from "../../util/page-store"

const connection = usePrimarySatelliteConnection()

const pageStore = usePageStore()

onMounted(() => {
	watch(
		() => connection.value?.state,
		(state, oldState) => {
			if (state == "connected") {
				pageStore.page = "dashboard"
			}
		},
		{
			immediate: true,
		}
	)
})
</script>
