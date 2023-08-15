<template>
	<div class="sequence-start">
		<i class="mdi mdi-play"></i>
	</div>
</template>

<script setup lang="ts"></script>

<style scoped>
.sequence-start {
	position: relative;

	border-radius: var(--border-radius);
	background-color: var(--darker-trigger-color);
	border: solid 2px var(--lighter-trigger-color);
	color: var(--trigger-color);

	height: var(--timeline-height);
	width: var(--instant-width);

	font-size: calc(var(--timeline-height) * 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
