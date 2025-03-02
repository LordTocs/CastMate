<template>
	<div class="docking-frame">
		<docking-tab-row v-model="model" />
		<div class="tab-area" @mousedown="onMouseDown">
			<docking-tab-body
				v-for="(tab, i) in model.tabs"
				:key="tab.id"
				v-model="model.tabs[i]"
				v-show="tab.id == model.currentTab"
			/>
			<docking-frame-drop-area />
		</div>
	</div>
</template>

<script setup lang="ts">
import { type DockedFrame } from "../../util/docking"
import DockingTabBody from "./DockingTabBody.vue"
import DockingTabRow from "./DockingTabRow.vue"
import { provide, ref, unref, useModel } from "vue"
import DockingFrameDropArea from "./DockingFrameDropArea.vue"
import { useDockingStore } from "../../main"

const props = defineProps<{
	modelValue: DockedFrame
}>()

const model = useModel(props, "modelValue")
provide("docking-frame", model)

const dockingStore = useDockingStore()

function onMouseDown(ev: MouseEvent) {
	dockingStore.rootDockArea.focusedFrame = model.value.id
}
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
