<template>
	<div class="group-logic-op" :class="{ and: isAnd, or: isOr }">
		<div class="logic-op-header flex flex-row p-1">
			<p-select
				v-model="groupType"
				:options="[
					{ name: 'Match All', value: 'and' },
					{ name: 'Match One', value: 'or' },
				]"
				option-label="name"
				option-value="value"
				size="small"
				append-to="self"
			/>
			<div class="flex-grow-1"></div>
			<p-button
				text
				size="small"
				:icon="excluded ? 'mdi mdi-equal' : 'mdi mdi-not-equal-variant'"
				@click="excluded = !excluded"
				v-if="!root"
			></p-button>
			<p-button text icon="mdi mdi-delete" @click="emits('delete')"></p-button>
		</div>
		<div class="logic-op-contents flex flex-column gap-1 p-2">
			<twitch-viewer-group-rule-negator
				v-for="(rule, i) in rules"
				v-model="rules[i]"
				:schema="schema"
				@delete="rules.splice(i, 1)"
			/>
		</div>
		<div class="flex flex-row gap-1 py-1 px-1">
			<p-button text size="small" @click="addGroup"><i class="mdi mdi-plus" />Group</p-button>
			<p-button text size="small" @click="addInlineGroup"><i class="mdi mdi-plus" />Viewers</p-button>
			<p-button text size="small" @click="addProperties"><i class="mdi mdi-plus" /> Properties</p-button>
			<p-button text size="small" @click="addCategory"><i class="mdi mdi-plus" /> Category</p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	SchemaTwitchViewerGroup,
	TwitchViewer,
	TwitchViewerGroupAnd,
	TwitchViewerGroupOr,
	isInlineViewerGroup,
} from "castmate-plugin-twitch-shared"
import { computed, useModel, ref } from "vue"
import TwitchViewerGroupRuleNegator from "./TwitchViewerGroupRuleNegator.vue"

import PSelect from "primevue/dropdown"
import PButton from "primevue/button"

const props = defineProps<{
	modelValue: TwitchViewerGroupAnd | TwitchViewerGroupOr
	schema: SchemaTwitchViewerGroup
	excluded: boolean
	root?: boolean
}>()

const model = useModel(props, "modelValue")
const excluded = useModel(props, "excluded")
const emits = defineEmits(["delete"])

const isAnd = computed(() => {
	return "and" in props.modelValue
})

const isOr = computed(() => {
	return "or" in props.modelValue
})

const groupType = computed({
	get() {
		if ("and" in model.value) {
			return "and"
		} else {
			return "or"
		}
	},
	set(v) {
		if (v in model.value) return

		if (v == "and" && "or" in model.value) {
			model.value = { and: model.value.or }
		} else if (v == "or" && "and" in model.value) {
			model.value = { or: model.value.and }
		}
	},
})

const rules = computed({
	get() {
		if ("and" in model.value) {
			return model.value.and
		} else {
			return model.value.or
		}
	},
	set(v) {
		if ("and" in model.value) {
			model.value.and = v
		} else {
			model.value.or = v
		}
	},
})

function addGroup() {
	rules.value.push({ group: null })
}

function addInlineGroup() {
	rules.value.push({ userIds: [""] })
}

function addProperties() {
	rules.value.push({ properties: {} })
}

function addCategory() {
	rules.value.push({ or: [{ properties: {} }] })
}
</script>

<style scoped>
.excluded > * > .group-logic-op {
	border-color: red;
	border-top-left-radius: 0;
	border-bottom-left-radius: 0;
}

.group-logic-op {
	border-radius: var(--border-radius);
	border: solid 1px white;
}

.logic-op-header {
	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);
}

.excluded > * > .group-logic-op > .logic-op-header {
	border-top-left-radius: 0;
}

.and {
	border-color: green;
}
.and .logic-op-header {
	background-color: green;
}

.or {
	border-color: blue;
}

.or .logic-op-header {
	background-color: blue;
}
</style>
