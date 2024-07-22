<template>
	<div class="group-ref p-1 pt-4">
		<data-input v-model="groupRef" :schema="groupSchema" class="flex-grow-1 flex-shrink-0" style="width: 0" />

		<p-button text size="small" icon="mdi mdi-delete" @click="deleteMe"></p-button>
		<p-button
			text
			size="small"
			:icon="excluded ? 'mdi mdi-equal' : 'mdi mdi-not-equal-variant'"
			@click="excluded = !excluded"
		></p-button>
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
	excluded: boolean
}>()

const model = useModel(props, "modelValue")
const excluded = useModel(props, "excluded")
const emit = defineEmits(["delete"])

const groupSchema: Schema = {
	type: ResourceProxyFactory,
	resourceType: "CustomTwitchViewerGroup",
	required: true,
	name: "Group",
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
.excluded > * > .group-ref {
	border-color: red;
	border-top-left-radius: 0;
	border-bottom-left-radius: 0;
}

.group-ref {
	border-radius: var(--border-radius);
	display: flex;
	flex-direction: row;
	border: solid 1px var(--surface-d);
}
</style>
