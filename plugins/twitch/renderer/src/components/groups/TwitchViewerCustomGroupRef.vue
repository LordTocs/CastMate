<template>
	<div class="group-ref">
		<data-input v-model="groupRef" :schema="groupSchema" />
		<p-button text icon="mdi mdi-close" @click="deleteMe"></p-button>
	</div>
</template>

<script setup lang="ts">
import { DataInput, ResourceProxyFactory } from "castmate-ui-core"
import { TwitchViewerGroupRule } from "castmate-plugin-twitch-shared"
import { computed, useModel } from "vue"
import { Schema } from "castmate-schema"
import PButton from "primevue/button"

const props = defineProps<{
	modelValue: TwitchViewerGroupRule
}>()

const model = useModel(props, "modelValue")
const emit = defineEmits(["delete"])

const groupSchema: Schema = {
	type: ResourceProxyFactory,
	resourceType: "CustomTwitchViewerGroup",
	required: true,
}

const groupRef = computed({
	get() {
		if (!("group" in model.value)) {
			return null
		}
		return model.value.group
	},
	set(v: string | null) {
		model.value = {
			group: v ?? null,
		}
	},
})

function deleteMe() {
	emit("delete")
}
</script>

<style scoped>
.group-ref {
	padding: 0.2rem;
	border-radius: var(--border-radius);
	display: flex;
	flex-direction: row;
}
</style>
