<template>
	<div class="tab">
		<component :is="modelValue.component" v-if="modelValue.component" />
	</div>
</template>

<script setup lang="ts">
import { type DockedTab } from "../../util/docking"

//Undo stack here?

const props = defineProps<{
	modelValue: DockedTab
}>()
</script>

<style scoped>
.tab {
	width: 100%;
	height: 100%;
}
</style>
