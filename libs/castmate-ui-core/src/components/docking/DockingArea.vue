<template>
	<div class="docking-area" v-bind="$attrs">
		<docking-split v-model="modelObj" />
	</div>
	<docking-teleports />
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { type DockedArea } from "../../util/docking"
import DockingSplit from "./DockingSplit.vue"
import { provide, useModel } from "vue"
import DockingTeleports from "./DockingTeleports.vue"

const props = defineProps<{
	modelValue: DockedArea
}>()

const modelObj = useModel(props, "modelValue")
provide("docking-area", modelObj)
</script>

<style scoped>
.docking-area {
	position: relative;
}
</style>
