<template>
	<div class="timeline-container" :class="{ indefinite }" :style="{ '--duration': props.modelValue.config.duration }">
		<div class="time-action" ref="actionElement" :style="{ ...actionColorStyle }">
			<div class="time-action-content">
				<div class="time-action-header">
					<i class="mdi flex-none" :class="action?.icon" />
					{{ action?.name }}
				</div>
				<div class="time-action-custom"></div>
				<div class="time-action-footer">
					{{ modelValue.config.duration.toFixed(2) }}
				</div>
			</div>
			<duration-handle v-model="model.config.duration" />
		</div>
		<div class="timeline-sequences">
			<offset-sequence-edit v-for="(o, i) in model.offsets" :key="o.id" v-model="model.offsets[i]" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { TimeAction } from "castmate-schema"
import { computed, useModel, ref, provide } from "vue"
import DurationHandle from "./DurationHandle.vue"
import { useAction, useActionColors } from "castmate-ui-core"
import OffsetSequenceEdit from "./OffsetSequenceEdit.vue"

const action = useAction(() => props.modelValue)
const { actionColorStyle } = useActionColors(() => props.modelValue)

const indefinite = computed(() => action.value?.type == "time-indefinite")

const props = defineProps<{
	modelValue: TimeAction
}>()

const model = useModel(props, "modelValue")

const actionElement = ref<HTMLElement | null>(null)
provide("actionElement", actionElement)
provide(
	"timeInfo",
	computed(() => ({
		minLength: 0,
		duration: model.value.config.duration,
		maxLength: undefined,
	}))
)
</script>

<style scoped>
.timeline-container {
	position: relative;
	width: calc(var(--duration) * var(--zoom-x) * 40px);
}

.time-action {
	display: flex;
	flex-direction: row;

	width: calc(var(--duration) * var(--zoom-x) * 40px);
	height: var(--timeline-height);
}
.time-action-content {
	/* border-radius: var(--border-radius); */
	background-color: var(--action-color);
	border-radius: var(--border-radius) 0 0 var(--border-radius);
	border-top: solid 2px var(--lighter-action-color);
	border-bottom: solid 2px var(--lighter-action-color);
	border-left: solid 2px var(--lighter-action-color);

	flex: 1;
	display: flex;
	flex-direction: column;
}

.time-action-header {
	background-color: var(--darker-action-color);
	height: 1.5rem;
	cursor: grab;
	overflow: hidden;
	white-space: nowrap;
	border-top-left-radius: var(--border-radius);
}

.indefinite .time-action-header {
	background: repeating-linear-gradient(
		45deg,
		var(--darker-action-color),
		var(--darker-action-color) 10px,
		var(--darkest-action-color) 10px,
		var(--darkest-action-color) 20px
	) !important;
}

.time-action-custom {
	flex: 1;
}

.time-action-footer {
	height: 1.5rem;
	text-align: center;
	background-color: var(--darker-action-color);
	overflow: hidden;
	white-space: nowrap;
}

.timeline-sequences {
	width: 100%;
	position: relative;
}
</style>
