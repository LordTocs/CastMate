<template>
	<div class="docking-area">
		<docking-split v-model="modelObj" />
	</div>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { type DockedSplit } from "../../util/docking"
import DockingSplit from "./DockingSplit.vue"

const props = defineProps<{
	modelValue: DockedSplit
}>()

const emit = defineEmits(["update:modelValue"])

const modelObj = useVModel(props, "modelValue", emit)
</script>

<style scoped>
.docking-area {
	position: relative;
	background-color: green;
}
</style>
