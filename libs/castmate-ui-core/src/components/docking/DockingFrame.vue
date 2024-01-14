<template>
	<div class="docking-frame">
		<docking-tab-row v-model="modelObj" />
		<div class="tab-area">
			<docking-tab-body
				v-for="(tab, i) in modelObj.tabs"
				:key="tab.id"
				v-model="modelObj.tabs[i]"
				v-show="tab.id == modelObj.currentTab"
			/>
			<docking-frame-drop-area />
		</div>
	</div>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { type DockedFrame } from "../../util/docking"
import DockingTabBody from "./DockingTabBody.vue"
import DockingTabRow from "./DockingTabRow.vue"
import { provide, ref, unref } from "vue"
import DockingFrameDropArea from "./DockingFrameDropArea.vue"

const props = defineProps<{
	modelValue: DockedFrame
}>()

const emit = defineEmits(["update:modelValue"])
const modelObj = useVModel(props, "modelValue", emit)
provide("docking-frame", modelObj.value)
</script>

<style scoped>
.docking-frame {
	position: relative;
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.tab-area {
	position: relative;
	display: flex;
	flex-direction: column;
	flex: 1;
}
</style>
