<template>
	<div class="nav-panel-section">
		<div class="nav-section-header" @click="toggleOpen">
			<slot name="header"> </slot>
		</div>
		<div class="nav-section-content" v-if="open">
			<slot></slot>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue"

const open = defineModel<boolean>("open", {
	default: false,
	required: false,
})

function toggleOpen() {
	open.value = !open.value
}
</script>

<style scoped>
.nav-panel-section {
	display: flex;
	flex-direction: column;
}

.nav-section-header {
	background-color: var(--surface-a);
	padding: 0.4rem;
	cursor: pointer;
}

.nav-section-header:hover {
	background-color: var(--highlight-bg);
}

.nav-section-content {
	display: flex;
	flex-direction: column;
	background-color: var(--surface-a);
}
</style>
