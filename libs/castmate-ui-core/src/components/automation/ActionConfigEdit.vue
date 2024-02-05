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
		<data-input v-model="model.config" :schema="actionInfo.config" :context="model.config" />
		<template v-if="isFlowAction(model) && actionInfo.type == 'flow'">
			<div class="flow-title">
				<span style="text-align: center; flex: 1">Flows</span>
				<p-button text icon="mdi mdi-plus" size="small" @click="addFlow()"></p-button>
			</div>

			<template v-if="actionInfo.flowConfig" v-for="(flow, i) in model.subFlows" :key="flow.id">
				<div class="section-header">
					<span style="padding-left: 1rem; flex: 1">Flow {{ i + 1 }}</span>
					<p-button text icon="mdi mdi-delete" size="small" @click="deleteFlow(i)"></p-button>
				</div>
				<data-input
					v-model="model.subFlows[i].config"
					:schema="actionInfo.flowConfig"
					:context="model.subFlows[i].config"
				></data-input>
			</template>
		</template>
		<template v-if="actionInfo.type == 'regular' && actionInfo.result">
			<div class="section-title">
				<span style="text-align: center; flex: 1">Returns</span>
			</div>
			<return-namer v-model="model.resultMapping" :result-schema="actionInfo.result" />
		</template>
	</div>
</template>

<script setup lang="ts">
import { AnyAction, constructDefault, isFlowAction } from "castmate-schema"
import { useAction, DataInput } from "../../main"
import { useModel } from "vue"
import PButton from "primevue/button"
import { SubFlow } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import ReturnNamer from "../data/returns/ReturnNamer.vue"
const props = defineProps<{
	modelValue: AnyAction
}>()

const model = useModel(props, "modelValue")

const actionInfo = useAction(() => props.modelValue)

function deleteFlow(index: number) {
	if (!isFlowAction(model.value)) return

	model.value.subFlows.splice(index, 1)
}

async function addFlow() {
	if (!isFlowAction(model.value) || actionInfo.value?.type != "flow") return
	const flow: SubFlow = {
		id: nanoid(),
		config: actionInfo.value.flowConfig ? await constructDefault(actionInfo.value.flowConfig) : {},
		actions: [],
	}
	model.value.subFlows.push(flow)
}
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

.flow-header {
	display: flex;
	flex-direction: row;
	align-items: center;
}

.section-title {
	display: flex;
	flex-direction: row;
	align-items: center;
}
</style>
