<template>
	<div class="docking-frame">
		<div class="docking-tab-row">
			<docking-tab-head v-for="tab in modelObj.tabs" :key="tab.id" :frame="modelObj" :id="tab.id" title="HUH" />
		</div>
		<docking-tab-body
			v-for="(tab, i) in modelObj.tabs"
			:key="tab.id"
			v-model="modelObj.tabs[i]"
			v-show="tab.id == modelObj.currentTab"
		/>
	</div>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { type DockedFrame } from "../../util/docking"

const props = defineProps<{
	modelValue: DockedFrame
}>()

const emit = defineEmits(["update:modelValue"])

const modelObj = useVModel(props, "modelValue", emit)
</script>

<style scoped>
.docking-frame {
	position: relative;
	width: 100%;
	height: 100%;
}
.docking-tab-row {
	display: flex;
	flex-direction: row;
	height: 3rem;
	overflow-y: hidden;
	overflow-x: auto;
	width: 100%;
}
</style>
