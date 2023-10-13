<template>
	<div v-if="actionInfo">
		<div class="action-header">
			<h3>
				<i v-if="actionInfo.icon" :class="actionInfo.icon" :style="{ color: actionInfo.color }" />{{
					actionInfo.name
				}}
			</h3>
			<p v-if="actionInfo.description">{{ actionInfo.description }}</p>
		</div>
		<data-input v-model="model.config" :schema="actionInfo?.config" />
	</div>
</template>

<script setup lang="ts">
import { AnyAction } from "castmate-schema"
import { useAction } from "castmate-ui-core"
import { useModel } from "vue"
import { DataInput } from "castmate-ui-core"
const props = defineProps<{
	modelValue: AnyAction
}>()

const model = useModel(props, "modelValue")

const actionInfo = useAction(() => props.modelValue)
</script>

<style scoped>
.action-header {
	padding-left: 0.5rem;
	padding-right: 0.5rem;
	padding-top: 0.5rem;
}

.action-header p {
	margin: 0;
	font-size: 0.8em;
}

.action-header h3 {
	margin: 0;
	text-align: center;
}

.action-header h3 i {
	margin-right: 0.3em;
}
</style>
