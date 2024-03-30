<template>
	<div class="edit-div" v-bind="$attrs" ref="labelDiv" @click="labelClick">
		{{ model }}
	</div>
	<drop-down-panel v-model="editOpen" :container="labelDiv">
		<p-input-number v-model="model" show-buttons :min="0" mode="decimal" />
	</drop-down-panel>
</template>

<script setup lang="ts">
import { ref, useModel } from "vue"
import { DropDownPanel } from "castmate-ui-core"

import PInputNumber from "primevue/inputnumber"

const props = defineProps<{
	modelValue: number
}>()

const model = useModel(props, "modelValue")

const labelDiv = ref<HTMLElement>()

const editOpen = ref(false)

function labelClick(ev: MouseEvent) {
	if (ev.button != 0) return

	editOpen.value = !editOpen.value
}
</script>

<style scoped>
.edit-div {
	cursor: pointer;
	background-color: rgba(255, 255, 255, 0.2);
	padding: 0.1rem;
	margin: 0;
	font-size: 10px;
}
</style>
