<template>
	<data-input-base
		v-model="model"
		:schema="schema"
		:toggle-template="false"
		:no-float="noFloat"
		:local-path="localPath"
	>
		<template #prepend>
			<p-button
				:icon="!pauseModel ? 'mdi mdi-play' : 'mdi mdi-pause'"
				class="no-focus-highlight"
				@click="pauseModel = !pauseModel"
			/>
		</template>

		<template #default="inputProps">
			<duration-field
				:required="props.schema.required"
				v-model="durationModel"
				@focus="onFocus"
				@blur="onBlur"
				v-bind="inputProps"
				ref="durationField"
				:emit-undo="false"
			/>
		</template>
	</data-input-base>
</template>

<script setup lang="ts">
import { SchemaTimer } from "castmate-schema"
import DataInputBase from "../base-components/DataInputBase.vue"
import { Timer, Duration } from "castmate-schema"
import { computed, onMounted, ref, useModel, watch } from "vue"
import { SharedDataInputProps } from "../DataInputTypes"
import PButton from "primevue/button"
import DurationField from "../base-components/DurationField.vue"
import { getTimeRemaining } from "castmate-schema"
import { isTimerStarted } from "castmate-schema"
import { pauseTimer } from "castmate-schema"
import { startTimer } from "castmate-schema"
import { useDataBinding, useDataUIBinding, useUndoCommitter } from "../../../util/data-binding"

const props = defineProps<
	{
		modelValue: Timer | undefined
		schema: SchemaTimer
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")
const undoModel = useUndoCommitter(model)

const updateForcer = ref(0)

const focused = ref(false)
function onFocus(ev: FocusEvent) {
	pullDuration()
	focused.value = true
}

function onBlur(ev: FocusEvent) {
	focused.value = false
	pushDuration()
	attemptAnimate()
}

const isRunning = computed(() => {
	return props.modelValue ? isTimerStarted(props.modelValue) : false
})

const editDuration = ref<Duration>()
const durationModel = computed<Duration | undefined>({
	get() {
		if (focused.value) {
			return editDuration.value
		} else {
			updateForcer.value
			return props.modelValue ? getTimeRemaining(props.modelValue) : undefined
		}
	},
	set(v) {
		editDuration.value = v
	},
})

const editPause = ref<boolean>(false)
const pauseModel = computed<boolean | undefined>({
	get() {
		if (!props.modelValue) {
			return undefined
		}

		if (focused.value) {
			return editPause.value
		} else {
			return !isTimerStarted(props.modelValue)
		}
	},
	set(v) {
		if (!focused.value) {
			if (!props.modelValue) return

			console.log("Setting Actual Value")

			if (!isTimerStarted(props.modelValue)) {
				undoModel.value = startTimer(props.modelValue)
			} else {
				undoModel.value = pauseTimer(props.modelValue)
			}
		} else {
			editPause.value = !!v
		}
	},
})

function pullDuration() {
	if (focused.value) return //Don't overwrite edit value if we're editing
	if (props.modelValue) {
		editDuration.value = getTimeRemaining(props.modelValue)
		editPause.value = !isTimerStarted(props.modelValue)
	} else {
		editDuration.value = undefined
		editPause.value = false
	}
}

function pushDuration() {
	if (editDuration.value == null) {
		model.value = undefined
		return
	}

	undoModel.value = Timer.fromDuration(editDuration.value, editPause.value)
}

function attemptAnimate() {
	if (isRunning.value && !focused.value) {
		requestAnimationFrame(updateTimer)
	}
}

onMounted(() => {
	watch(
		() => props.modelValue,
		() => {
			attemptAnimate()
		},
		{ immediate: true }
	)
})

function updateTimer(timestamp: number) {
	updateForcer.value++

	attemptAnimate()
}

const durationField = ref<InstanceType<typeof DurationField>>()

useDataUIBinding({
	focus() {
		durationField.value?.focus()
	},
	scrollIntoView() {
		durationField.value?.scrollIntoView()
	},
})
</script>

<style scoped></style>
