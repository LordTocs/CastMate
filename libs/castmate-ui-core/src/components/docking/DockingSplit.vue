<template>
	<p-splitter class="docked-split" :layout="modelValue.direction">
		<p-splitter-panel v-for="(division, i) in modelObj.divisions" :key="division.id">
			<docking-split
				v-if="modelObj.divisions[i].type == 'split'"
				v-model="(modelObj.divisions[i] as DockedSplit)"
			/>
			<docking-frame v-else v-model="(modelObj.divisions[i] as DockedFrame)" :key="modelObj.divisions[i].id" />
		</p-splitter-panel>
	</p-splitter>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { type DockedSplit, type DockedFrame } from "../../util/docking"
import DockingFrame from "./DockingFrame.vue"
import DockingDivider from "./DockingDivider.vue"

import PSplitter from "primevue/splitter"
import PSplitterPanel from "primevue/splitterpanel"
import { useVModel } from "@vueuse/core"

const props = defineProps<{
	modelValue: DockedSplit
}>()

const emit = defineEmits(["update:modelValue"])

const modelObj = useVModel(props, "modelValue", emit)

const horizontal = computed(() => props.modelValue.direction == "horizontal")
const vertical = computed(() => props.modelValue.direction == "vertical")

const sizes = computed(() => {
	let remaining = 1

	for (const divider of props.modelValue.dividers) {
		remaining -= divider
	}

	return [...props.modelValue.dividers, remaining]
})

function getSplitStyle(index: number) {
	return {
		[horizontal.value ? "width" : "height"]: `calc(${sizes.value[index] * 100}% - ${
			props.modelValue.dividers.length * 3
		}px)`,
	}
}
</script>

<style scoped>
.docked-split {
	width: 100%;
	height: 100%;
	border-radius: 0 !important;
	border-top: none;
}

.horizontal {
	display: flex;
	flex-direction: row;
}

.vertical {
	display: flex;
	flex-direction: column;
}
</style>
