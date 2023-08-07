<template>
	<div
		class="project-item"
		:class="{ openable: props.item?.open != null }"
		:style="{ '--indent': indent }"
		@click="onClick"
	>
		<slot name="icon">
			<i :class="item.icon" class="px-1" v-if="item.icon"></i>
		</slot>
		<div class="project-item-title">{{ item.title }}</div>
		<slot name="end"></slot>
	</div>
</template>

<script setup lang="ts">
import { ProjectItem } from "castmate-ui-core"

const props = withDefaults(
	defineProps<{
		item: ProjectItem
		indent?: number
	}>(),
	{ indent: 0 }
)

function onClick(ev: MouseEvent) {
	if (ev.button == 0) {
		props.item?.open?.()
		ev.preventDefault()
		ev.stopPropagation()
	}
}
</script>

<style scoped>
.project-item {
	height: 2rem;
	width: 100%;
	display: flex;
	flex-direction: row;
	align-items: center;
	padding-left: calc(var(--indent) * 2rem + 0.5rem);
	padding-right: 0.5rem;
}

.openable {
	cursor: pointer;
}

.project-item-title {
	flex: 1;
	user-select: none;
}

.project-item:hover {
	background-color: var(--highlight-bg);
}
</style>
