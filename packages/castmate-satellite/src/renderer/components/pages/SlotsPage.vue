<template>
	<flex-scroller class="flex-grow-1" inner-class="flex flex-column">
		<div class="text-center">
			<h2>Dashboard Slots</h2>
			<h4>
				Slots are a way to share resources remotely. Choose which smart devices or sound devices you want to
				give access to.
			</h4>
		</div>
		<div class="flex flex-column px-5 gap-5 flex-grow-1">
			<div v-for="slotId in satelliteResources.slotBindings.keys()" :key="slotId">
				<satellite-resource-slot-binding-edit :slot-id="slotId" />
			</div>
		</div>
		<div class="flex flex-row justify-content-center mb-5">
			<p-button size="large" @click="done">Done</p-button>
		</div>
	</flex-scroller>
</template>

<script setup lang="ts">
import { FlexScroller, SatelliteResourceSlotBindingEdit, useSatelliteResourceStore } from "castmate-ui-core"

import PButton from "primevue/button"
import { usePageStore } from "../../util/page-store"

const satelliteResources = useSatelliteResourceStore()

const pageStore = usePageStore()

function done(ev: MouseEvent) {
	pageStore.page = "dashboard"
}
</script>

<style scoped></style>
