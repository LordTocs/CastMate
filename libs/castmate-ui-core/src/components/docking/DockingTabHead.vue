<template>
	<div class="docked-tab-head" :class="{ selected, unselected: !selected }">
		{{ title }}
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { type DockedFrame, type DockedTab } from "../../util/docking"

const props = defineProps<{
	frame: DockedFrame
	id: string
	title: string
}>()

const selected = computed(() => props.frame.currentTab == props.id)
</script>

<style scoped>
.docked-tab-head {
	height: 100%;
}

.selected {
	border-top: 1px solid red;
	border-left: 1px solid red;
	border-right: 1px solid red;
	border-bottom: none;
}

.unselected {
	border-bottom: 1px solid red;
}
</style>
