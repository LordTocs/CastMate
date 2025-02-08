<template>
	<div class="edit-div" v-bind="$attrs" ref="labelDiv" @click="labelClick">
		{{ model }}
	</div>
	<drop-down-panel v-model="editOpen" :container="labelDiv">
		<number-field v-model="model" :min="0" ref="numField" :allow-empty="false" />
	</drop-down-panel>
</template>

<script setup lang="ts">
import { nextTick, ref, useModel } from "vue"
import { DropDownPanel, NumberField, useDataBinding } from "castmate-ui-core"

const props = defineProps<{
	localPath: string
}>()

const model = defineModel<number>({ required: true })

useDataBinding(() => props.localPath)

const labelDiv = ref<HTMLElement>()

const editOpen = ref(false)

const numField = ref<InstanceType<typeof NumberField>>()

function labelClick(ev: MouseEvent) {
	if (ev.button != 0) return

	editOpen.value = !editOpen.value
	nextTick(() => {
		numField.value?.focus()
	})
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
