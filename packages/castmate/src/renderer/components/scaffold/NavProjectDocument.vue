<template>
	<nav-panel-item icon="mdi mdi-star" @click="handleClick">
		{{ info.name }}
	</nav-panel-item>
</template>

<script setup lang="ts">
import { ProjectTreeFileInfo } from "castmate-schema"
import NavPanelItem from "./NavPanelItem.vue"

const props = defineProps<{
	info: ProjectTreeFileInfo
}>()

function handleClick(ev: MouseEvent) {}
</script>
