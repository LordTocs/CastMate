<template>
	<div class="nav-panel-item" @click="clickHandler">
		<slot name="icon">
			<i :class="icon" />
		</slot>
		<slot></slot>
	</div>
</template>

<script setup lang="ts">
const emits = defineEmits(["click"])

const props = defineProps<{
	icon?: string
}>()

function clickHandler(ev: MouseEvent) {
	emits("click")
	ev.stopPropagation()
	ev.preventDefault()
}
</script>

<style scoped>
.nav-panel-item {
	background-color: var(--surface-a);
	padding: 0.1rem;
	padding-left: 0.5rem;
}
.nav-panel-item:hover {
	background-color: var(--highlight-bg);
}
</style>
