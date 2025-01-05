<template>
	<p-fieldset>
		<template #legend>
			<div class="dashboard-card-header">
				<slot name="header"> &nbsp; </slot>
			</div>
		</template>
		<div class="dashboard-card-row">
			<slot></slot>
		</div>
	</p-fieldset>
</template>

<script setup lang="ts">
import PFieldset from "primevue/fieldset"
</script>

<style scoped>
.dashboard-card {
	border-radius: var(--border-radius);
	border: solid 2px var(--surface-border);
	padding: 0.25rem;
	display: flex;
	flex-direction: column;
}

.dashboard-card-row {
}

.dashboard-card-header {
	color: var(--text-color-secondary);
	font-size: 0.75rem;
}
</style>
