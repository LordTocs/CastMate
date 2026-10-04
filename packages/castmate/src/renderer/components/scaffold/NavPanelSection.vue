<template>
	<div class="nav-panel-section">
		<div class="section-header" @click="toggleOpen">
			<slot name="header"> </slot>
		</div>
		<div class="section-content" v-if="open">
			<slot></slot>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue"

const open = ref(false)

function toggleOpen() {
	open.value = !open.value
}
</script>

<style scoped>
.nav-panel-section {
	display: flex;
	flex-direction: column;
}

.section-header {
	background-color: var(--surface-a);
}

.section-header:hover {
	background-color: var(--highlight-bg);
}

.section-content {
	display: flex;
	flex-direction: column;
	background-color: var(--surface-a);
}

.section-header {
	cursor: pointer;
}
</style>
