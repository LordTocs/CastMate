<template>
	<div class="migration-check" :class="{ checked: checked, 'not-checked': !checked }">
		<i class="pi text-3xl" :class="{ 'pi-check': checked, 'pi-times': !checked }"></i>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	checked: boolean
}>()
</script>

<style scoped>
.migration-check {
	display: inline-flex;
	padding: 0.3rem;
	height: 3rem;
	width: 3rem;

	border: solid 3px white;
	border-radius: var(--border-radius);

	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.migration-check.checked {
	border-color: #4ade80;
	color: #4ade80;
}

.migration-check.not-checked {
	border-color: #f87171;
	color: #f87171;
}
</style>
