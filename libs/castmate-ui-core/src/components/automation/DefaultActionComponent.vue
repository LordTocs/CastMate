<template>
	<div class="action-preview-container">
		<div class="cropper">
			<data-view v-if="actionInfo" :model-value="modelValue" :schema="actionInfo.config" />
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
}

.cropper {
	flex: 1;
	width: 0;
	overflow: hidden;
	white-space: nowrap;
}
</style>
