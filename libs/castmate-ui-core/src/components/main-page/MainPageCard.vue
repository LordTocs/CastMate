<template>
	<div class="dashboard-card">
		<div class="dashboard-card-header">
			<slot name="header"> &nbsp; </slot>
		</div>
		<div class="dashboard-card-row">
			<slot></slot>
		</div>
	</div>
</template>

<style scoped>
.dashboard-card {
	height: var(--dashboard-height);
	border-radius: var(--border-radius);
	border: solid 2px var(--surface-border);
	padding: 0.25rem;
	display: flex;
	flex-direction: column;
}

.dashboard-card-row {
	display: flex;
	flex-direction: row;
	flex: 1;
}

.dashboard-card-header {
	color: var(--text-color-secondary);
	font-size: 0.75rem;
}
</style>
