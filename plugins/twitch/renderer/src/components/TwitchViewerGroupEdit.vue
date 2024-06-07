<template>
	<div class="group-edit">
		<div class="flex flex-column align-items-center justify-content-center" v-if="!model?.rule">
			<p>Trigger runs for Everyone</p>
			<p-button @click="addEither">Customize</p-button>
		</div>
		<twitch-viewer-group-logic-op
			v-model="model.rule"
			:excluded="false"
			v-else
			@delete="model.rule = undefined"
			:root="true"
		/>
	</div>
</template>

<script setup lang="ts">
import { TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import { useModel } from "vue"
import TwitchViewerGroupLogicOp from "./groups/TwitchViewerGroupLogicOp.vue"
import PButton from "primevue/button"
import PCheckBox from "primevue/checkbox"
import PDropDown from "primevue/dropdown"

const props = defineProps<{
	modelValue?: TwitchViewerGroup
}>()

const model = useModel(props, "modelValue")

function addEither() {
	model.value = {
		rule: {
			or: [{ properties: {} }],
		},
	}
}
</script>

<style scoped>
.group-edit {
	min-width: 40rem;
	max-height: 30rem;
	overflow-y: auto;
	min-height: 10rem;
}
</style>
