<template>
	<p-button @click="startConnection"> {{ option.dashName }}</p-button>
</template>

<script setup lang="ts">
import PButton from "primevue/button"
import { DashboardConnectionOption } from "castmate-plugin-dashboards-shared"

const props = defineProps<{
	option: DashboardConnectionOption
}>()

function startConnection(ev: MouseEvent) {}
</script>
