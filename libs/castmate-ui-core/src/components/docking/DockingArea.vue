<template>
	<div class="docking-area">
		<docking-split v-model="modelObj" />
	</div>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { type DockedArea } from "../../util/docking"
import DockingSplit from "./DockingSplit.vue"
import { provide } from "vue"

const props = defineProps<{
	modelValue: DockedArea
}>()

const emit = defineEmits(["update:modelValue"])

const modelObj = useVModel(props, "modelValue", emit)
provide("docking-area", modelObj.value)
</script>

<style scoped>
.docking-area {
	position: relative;
}
</style>
