<template>
	<div class="dash-group">
		<div class="dash-group-header">
			<div class="flex flex-row align-items-center justify-content-center">
				<h2 class="mr-2">
					<p-avatar shape="circle" :image="remoteIcon" />
				</h2>
				<h2>
					<span> {{ remoteName }} </span> Dashboards
				</h2>
			</div>
			<hr />
		</div>
		<div class="dash-options">
			<remote-dash-button v-for="option in options" :option="option" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { DashboardConnectionOption } from "../../util/connection-types"
import RemoteDashButton from "./RemoteDashButton.vue"

import PAvatar from "primevue/avatar"

const props = defineProps<{
	options: DashboardConnectionOption[]
}>()

const remoteName = computed(() => props.options[0]?.remoteDisplayName ?? "UNKNOWN USER")
const remoteIcon = computed(() => props.options[0]?.remoteDisplayIcon ?? "")
</script>

<style scoped>
.dash-options {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;

	justify-content: center;
	align-items: center;
	gap: 1rem;
}
</style>
