<template>
	<div
		class="frame-split"
		:class="{ horizontal: props.horizontal, vertical: !props.horizontal }"
	>
		<template v-for="(view, i) in views">
			<docking-frame v-if="!isSplit(view)" />
			<docking-split v-else />
			<docking-divider
				v-if="i < views.length - 1"
				:horizontal="props.horizontal"
			/>
		</template>
	</div>
</template>

<script setup>
import { computed } from "vue"
import DockingDivider from "./DockingDivider.vue"
import DockingFrame from "./DockingFrame.vue"
/*
[
	{ width: 0.5 }
	{ width: 0.5 }
	{ width:}
]

*/
const props = defineProps({
	modelValue: {},
	horizontal: { props: Boolean, default: false },
})

const emit = defineEmits(["update:modelValue"])

const views = computed(() => props.modelValue ?? [])

function isSplit(view) {
	return false
}
</script>

<style scoped>
.docking-view {
	background-color: blue;
}

.frame-split {
	width: 100%;
	height: 100%;
}

.horizontal {
}

.vertical {
}
</style>
