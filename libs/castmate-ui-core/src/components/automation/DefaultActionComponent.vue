<template>
	<div class="action-preview-container">
		<div class="cropper flex flex-column align-items-center justify-content-center">
			<data-view
				v-if="actionInfo"
				:model-value="modelValue"
				:schema="actionInfo.config"
				:context="modelValue"
				no-label
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import DataView from "../data/DataView.vue"
import { useAction } from "../../main"

const props = defineProps<{
	modelValue: Object
	plugin?: string
	action?: string
}>()

const actionInfo = useAction(() => props)
</script>

<style scoped>
.action-preview-container {
	font-size: 0.7rem;
	display: flex;
	padding: 0 0.25rem;
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
}

.cropper {
	flex: 1;
	width: 0;
	overflow: hidden;
	white-space: nowrap;
	text-align: center;
}
</style>
