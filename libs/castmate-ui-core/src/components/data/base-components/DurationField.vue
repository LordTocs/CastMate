<template>
	<div
		class="p-dropdown p-inputwrapper"
		:class="{
			'p-filled': inputValue.length > 0 || focused,
			'p-focused': focused,
			'p-inputwrapper-filled': inputValue.length > 0 || focused,
			'p-inputwrapper-focused': focused,
		}"
		:input-id="inputId"
	>
		<fake-input-backbone
			ref="hiddenInput"
			v-model="inputValue"
			v-model:focused="focused"
			v-model:selection="selection"
			inputmode="numeric"
			@blur="onBlur"
			@focus="onFocus"
			@keypress="onKeyPress"
		/>
		<div
			class="p-dropdown-label p-component p-inputtext duration-input"
			:class="{
				'forced-focus': focused,
			}"
			ref="imposterDiv"
			@click="onFakeClick"
		>
			<span class="prop-up"></span>
			<fake-input-string
				:text="inputHours"
				:offset="0"
				:selection="selection"
				:focused="focused"
				postfix="h "
				@select-char="onCharSelect"
				ref="fakeHours"
				v-model:partial-select="hoursPartialSel"
				:selection-container="imposterDiv"
				:drag-rect="dragState.dragRect"
			/>
			<fake-input-string
				:text="inputMins"
				:offset="minutesOffset"
				:selection="selection"
				:focused="focused"
				postfix="m "
				@select-char="onCharSelect"
				ref="fakeMinutes"
				v-model:partial-select="minutesPartialSel"
				:selection-container="imposterDiv"
				:drag-rect="dragState.dragRect"
			/>
			<fake-input-string
				:text="inputSeconds"
				:offset="secondsOffset"
				:selection="selection"
				:focused="focused"
				postfix="s "
				:last="true"
				@select-char="onCharSelect"
				ref="fakeSeconds"
				v-model:partial-select="secondsPartialSel"
				:selection-container="imposterDiv"
				:drag-rect="dragState.dragRect"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Duration, parseDurationParts } from "castmate-schema"
import { computed, onMounted, ref, useModel, watch } from "vue"
import FakeInputString from "../../fake-input/FakeInputString.vue"
import FakeInputBackbone from "../../fake-input/FakeInputBackbone.vue"
import { InputSelection, PartialSelectionResult, useCombinedPartialSelects } from "../../fake-input/FakeInputTypes"
import { useClickDragRect, usePropagationStop } from "../../../util/dom"
import { emit } from "process"

const props = defineProps<{
	modelValue: Duration | undefined
	required?: boolean
	inputId?: string
	placeholder?: string
}>()

const emits = defineEmits(["update:modelValue", "blur", "focus"])

const model = useModel(props, "modelValue")

const HOUR_DUR = 60 * 60
const MINUTE_DUR = 60

const inputValue = ref<string>("")
const hiddenInput = ref<InstanceType<typeof FakeInputBackbone> | null>(null)

const inputNegative = computed(() => {
	return inputValue.value.startsWith("-")
})

const absInput = computed(() => {
	return inputNegative.value ? inputValue.value.substring(1) : inputValue.value
})

const inputDecimalIdx = computed(() => {
	let decimalIdx = absInput.value.indexOf(".")
	if (decimalIdx == -1) {
		decimalIdx = absInput.value.length
	}
	return decimalIdx
})

const inputSeconds = computed(() => {
	let endIdx = absInput.value.length
	let startIdx = inputDecimalIdx.value - 2

	const seconds = absInput.value.substring(inputDecimalIdx.value - 2)

	if (inputNegative.value && startIdx <= 0) {
		return "-" + seconds
	}
	return seconds
})

const secondsOffset = computed(() => inputHours.value.length + inputMins.value.length)

const inputMins = computed(() => {
	let endIdx = inputDecimalIdx.value - 2
	let startIdx = inputDecimalIdx.value - 4

	const minutes = absInput.value.substring(inputDecimalIdx.value - 4, inputDecimalIdx.value - 2)

	if (inputNegative.value && startIdx <= 0 && endIdx > 0) {
		return "-" + minutes
	}

	return minutes
})

const minutesOffset = computed(() => inputHours.value.length)

const inputHours = computed(() => {
	let endIdx = inputDecimalIdx.value - 4
	let startIdx = 0

	const hours = absInput.value.substring(0, inputDecimalIdx.value - 4)
	if (inputNegative.value && endIdx > 0) {
		return "-" + hours
	}
	return hours
})

const focused = ref(false)
const selection = ref<InputSelection>({ start: null, end: null, direction: null })

const stopPropagation = usePropagationStop()

function onCharSelect(index: number) {
	hiddenInput.value?.focus()
	hiddenInput.value?.selectChars(index, index)
}

function onFakeClick(ev: MouseEvent) {
	hiddenInput.value?.focus()
	if (!dragState.value.dragRect) {
		hiddenInput.value?.selectChars(inputValue.value.length, inputValue.value.length)
	}
	stopPropagation(ev)
	ev.preventDefault()
}

//Selection Drag
const imposterDiv = ref<HTMLElement | null>(null)
const dragState = useClickDragRect(imposterDiv, () => {
	hiddenInput.value?.focus()
})

const hoursPartialSel = ref<PartialSelectionResult | null>(null)
const minutesPartialSel = ref<PartialSelectionResult | null>(null)
const secondsPartialSel = ref<PartialSelectionResult | null>(null)

const dragSelection = useCombinedPartialSelects(hoursPartialSel, minutesPartialSel, secondsPartialSel)

watch(dragSelection, () => {
	if (!dragSelection.value) {
		hiddenInput.value?.selectChars(null, null)
		return
	}
	hiddenInput.value?.selectChars(dragSelection.value.start, dragSelection.value.end + 1)
})

//Conversion to/from number
function parseFromModel() {
	if (model.value == null) {
		inputValue.value = ""
		return
	}

	const parts = parseDurationParts(model.value)

	let result = ""
	if (parts.sign != null && parts.sign < 0) {
		result += "-"
	}

	if (parts.hours != null) {
		result += parts.hours

		result += (parts.minutes ?? 0).toLocaleString("en-Us", {
			minimumIntegerDigits: 2,
			useGrouping: false,
		})

		result += (parts.seconds ?? 0).toLocaleString("en-Us", {
			minimumIntegerDigits: 2,
			useGrouping: false,
		})
	} else if (parts.minutes != null) {
		result += parts.minutes

		result += (parts.seconds ?? 0).toLocaleString("en-Us", {
			minimumIntegerDigits: 2,
			maximumFractionDigits: 4,
			useGrouping: false,
		})
	} else {
		result += (parts.seconds ?? 0).toLocaleString("en-Us", {
			maximumFractionDigits: 4,
			useGrouping: false,
		})
	}

	inputValue.value = result
}

function sendToModel() {
	//Converts our number to the model, does nothing if we get nan
	if (inputValue.value.length == 0) {
		if (props.required) {
			model.value = 0
		} else {
			model.value = undefined
		}
	}

	const sign = inputNegative.value ? -1 : 1

	const hours = Math.abs(Number(inputHours.value))
	const minutes = Math.abs(Number(inputMins.value))
	const seconds = Math.abs(Number(inputSeconds.value))

	if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
		return
	}

	model.value = sign * (hours * HOUR_DUR + minutes * MINUTE_DUR + seconds)
}

function onBlur(ev: FocusEvent) {
	sendToModel()
	parseFromModel()
	emits("blur", ev)
}

function onFocus(ev: FocusEvent) {
	emits("focus", ev)
}

onMounted(() => {
	parseFromModel()
})

watch(inputValue, () => {
	if (focused.value) {
		sendToModel()
	}
})

watch(
	() => props.modelValue,
	() => {
		if (!focused.value) {
			parseFromModel()
		}
	}
)

function onKeyPress(ev: KeyboardEvent) {
	if (!ev.key.match(/[0-9\.]/g)) {
		ev.preventDefault()
	}
	if (ev.key == ".") {
		if (inputValue.value.includes(".")) {
			ev.preventDefault()
		}
	}
}
</script>

<style scoped>
.forced-focus {
	outline: 0 none;
	outline-offset: 0;
	box-shadow: 0 0 0 1px #e9aaff;
	border-color: #c9b1cb;
}

.duration-input {
	cursor: text;
}

.prop-up {
	display: inline-block;
	height: 1em;
	width: 0;
}
</style>
