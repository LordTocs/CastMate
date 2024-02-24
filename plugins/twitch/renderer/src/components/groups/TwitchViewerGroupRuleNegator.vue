<template>
	<div class="rule-negator flex flex-row" :class="{ excluded }">
		<div class="negative-strip" v-if="excluded"></div>
		<div class="flex-grow-1 flex-shrink-0">
			<twitch-viewer-group-logic-op
				v-if="isLogicGroup(internalModel)"
				v-model="internalModel"
				v-model:excluded="excluded"
				@delete="emit('delete')"
			/>
			<twitch-viewer-group-resource-ref
				v-else-if="isGroupResourceRef(internalModel)"
				v-model="internalModel"
				v-model:excluded="excluded"
				@delete="emit('delete')"
			/>
			<twitch-viewer-group-inline-group
				v-else-if="isInlineViewerGroup(internalModel)"
				v-model="internalModel"
				v-model:excluded="excluded"
				@delete="emit('delete')"
			/>
			<twitch-viewer-group-property-edit
				v-else-if="isViewerGroupPropertyRule(internalModel)"
				v-model="internalModel"
				v-model:excluded="excluded"
				@delete="emit('delete')"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	TwitchViewerGroupRule,
	isExclusionRule,
	isLogicGroup,
	TwitchViewerGroupExclusion,
	isGroupResourceRef,
	isInlineViewerGroup,
	isViewerGroupPropertyRule,
} from "castmate-plugin-twitch-shared"
import TwitchViewerGroupLogicOp from "./TwitchViewerGroupLogicOp.vue"
import TwitchViewerGroupResourceRef from "./TwitchViewerGroupResourceRef.vue"
import TwitchViewerGroupInlineGroup from "./TwitchViewerGroupInlineGroup.vue"
import TwitchViewerGroupPropertyEdit from "./TwitchViewerGroupPropertyEdit.vue"
import { computed, useModel } from "vue"
import PButton from "primevue/button"

const props = defineProps<{
	modelValue: TwitchViewerGroupRule
}>()

const model = useModel(props, "modelValue")

const emit = defineEmits(["update:modelValue", "delete"])

const excluded = computed<boolean>({
	get() {
		return isExclusionRule(props.modelValue)
	},
	set(v) {
		if (isExclusionRule(props.modelValue) && !v) {
			emit("update:modelValue", props.modelValue.exclude)
		} else if (!isExclusionRule(props.modelValue) && v) {
			emit("update:modelValue", { exclude: props.modelValue })
		}
	},
})

const internalModel = computed<Exclude<TwitchViewerGroupRule, TwitchViewerGroupExclusion>>({
	get() {
		if (isExclusionRule(props.modelValue)) {
			return props.modelValue.exclude
		} else {
			return props.modelValue
		}
	},
	set(v) {
		if (isExclusionRule(model.value)) {
			model.value.exclude = v
		} else {
			model.value = v
		}
	},
})
</script>

<style scoped>
.negative-strip {
	border-top-left-radius: var(--border-radius);
	border-bottom-left-radius: var(--border-radius);
	background-color: red;
	width: 1rem;
}
</style>
