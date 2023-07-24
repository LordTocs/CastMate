<template>
	<div class="project-category">
		<div class="project-category-header" @click="expanded = !expanded">
			<i :class="`mdi ${expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'}`"></i>
			<slot name="icon">
				<i :class="icon" class="px-1" v-if="icon"></i>
			</slot>
			<span style="flex: 1">{{ title }}</span>
		</div>
		<div class="project-category-content" v-show="expanded">
			<slot></slot>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue"

const props = defineProps<{
	title: string
	icon?: string
}>()

const expanded = ref(false)
</script>

<style scoped>
.project-category {
	width: 100%;
}

.project-category-header {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	height: 2rem;

	user-select: none;
}

.project-category-header:hover {
	background-color: var(--highlight-bg);
}
</style>
