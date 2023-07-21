<template>
	<div
		class="action-element"
		:class="{ 'time-action': isTimed, 'instant-action': !isTimed }"
		:style="{
			'--action-color': actionColor,
			'--darker-action-color': darkerActionColor,
			'--lighter-action-color': lighterActionColor,
			'--duration': duration,
		}"
		ref="actionElement"
	>
		<div class="action-content">
			<div class="action-header">
				<i class="mdi flex-none" :class="actionDef?.icon" />
				{{ actionDef?.name }}
			</div>
		</div>
		<duration-handle v-if="isTimed" v-model="duration" />
	</div>
</template>

<script setup lang="ts">
import { type ActionInfo } from "castmate-schema"
import { useAction, useActionColors } from "castmate-ui-core"
import { computed, provide, ref } from "vue"
import * as chromatism from "chromatism2"
import { useVModel } from "@vueuse/core"
import { TimeAction } from "castmate-schema"
import DurationHandle from "./DurationHandle.vue"

const props = defineProps<{
	modelValue: ActionInfo
}>()

const emit = defineEmits(["update:modelValue"])
const modelObj = useVModel(props, "modelValue", emit)
const duration = computed<number>({
	get() {
		const ti = props.modelValue as TimeAction
		return ti.config.duration
	},
	set(v: number) {
		modelObj.value.config.duration = v
	},
})

const actionElement = ref<HTMLElement | null>(null)
provide("actionElement", actionElement)

const actionDef = useAction(props.modelValue)
const isTimed = computed(() => actionDef.value?.type == "time" || actionDef.value?.type == "time-indefinite")

const { actionColor, darkerActionColor, lighterActionColor } = useActionColors(() => props.modelValue)
</script>

<style scoped>
.action-header {
	background-color: var(--darker-action-color);
	height: 1.5rem;
	cursor: grab;
}

.action-content {
	flex: 1;
}

.action-element {
	border-radius: var(--border-radius);
	background-color: var(--action-color);
	border: solid 2px var(--action-color);
	height: var(--timeline-height);
	display: flex;
	flex-direction: row;
}

.instant-action {
	width: var(--timeline-height);
}

.time-action {
	width: calc(var(--duration) * var(--zoom-x) * 40px);
}
</style>
