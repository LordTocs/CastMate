<template>
	<div class="p-inputgroup w-full" @mousedown="stopEvent">
		<span class="p-float-label">
			<div
				class="p-dropdown p-inputwrapper"
				:class="{
					'p-filled': inputValue.length > 0 || focused,
					'p-focused': focused,
					'p-inputwrapper-filled': inputValue.length > 0 || focused,
					'p-inputwrapper-focused': focused,
				}"
				input-id="duration"
			>
				<fake-input-backbone
					ref="hiddenInput"
					v-model="inputValue"
					v-model:focused="focused"
					v-model:selection="selection"
					@blur="onBlur"
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
			<label for="duration">
				{{ schema.name }}
			</label>
		</span>
		<p-button class="flex-none" v-if="!schema.required" icon="pi pi-times" @click.stop="clear" />
	</div>
</template>

<script setup lang="ts">
import { Duration } from "castmate-schema"
import { stopEvent } from "../../../main"
import { computed, onMounted, ref, useModel, watch } from "vue"
import { SchemaDuration } from "castmate-schema"
import FakeInputString from "../../fake-input/FakeInputString.vue"
import FakeInputBackbone from "../../fake-input/FakeInputBackbone.vue"
import { InputSelection, PartialSelectionResult, useCombinedPartialSelects } from "../../fake-input/FakeInputTypes"
import { useClickDragRect } from "../../../util/dom"
import PButton from "primevue/button"

const props = defineProps<{
	modelValue: Duration | undefined
	schema: SchemaDuration
}>()

const model = useModel(props, "modelValue")

const HOUR_DUR = 60 * 60
const MINUTE_DUR = 60

const inputValue = ref<string>("")
const hiddenInput = ref<InstanceType<typeof FakeInputBackbone> | null>(null)

const inputDecimalIdx = computed(() => {
	let decimalIdx = inputValue.value.indexOf(".")
	if (decimalIdx == -1) {
		decimalIdx = inputValue.value.length
	}
	return decimalIdx
})

const inputSeconds = computed(() => {
	const seconds = inputValue.value.substring(inputDecimalIdx.value - 2)
	return seconds
})

const secondsOffset = computed(() => inputHours.value.length + inputMins.value.length)

const inputMins = computed(() => {
	const minutes = inputValue.value.substring(inputDecimalIdx.value - 4, inputDecimalIdx.value - 2)
	return minutes
})

const minutesOffset = computed(() => inputHours.value.length)

const inputHours = computed(() => {
	const hours = inputValue.value.substring(0, inputDecimalIdx.value - 4)
	return hours
})

const focused = ref(false)
const selection = ref<InputSelection>({ start: null, end: null, direction: null })

function onCharSelect(index: number) {
	hiddenInput.value?.focus()
	hiddenInput.value?.selectChars(index, index)
}

function onFakeClick(ev: MouseEvent) {
	hiddenInput.value?.focus()
	if (!dragState.value.dragRect) {
		hiddenInput.value?.selectChars(inputValue.value.length, inputValue.value.length)
	}
	ev.stopPropagation()
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

	let hours = 0
	let minutes = 0
	let seconds = 0

	let remaining = model.value as number
	if (remaining > HOUR_DUR) {
		hours = Math.floor(remaining / HOUR_DUR)
		remaining = remaining % HOUR_DUR
	}
	if (remaining > MINUTE_DUR) {
		minutes = Math.floor(remaining / MINUTE_DUR)
		remaining = remaining % MINUTE_DUR
	}
	seconds = remaining

	let result = ""
	if (hours > 0) {
		result += hours

		result += minutes.toLocaleString("en-Us", {
			minimumIntegerDigits: 2,
			useGrouping: false,
		})

		result += seconds
	} else if (minutes > 0) {
		result += minutes

		result += seconds
	} else {
		result += seconds
	}

	inputValue.value = result
}

function sendToModel() {
	//Converts our number to the model, does nothing if we get nan
	if (inputValue.value.length == 0) {
		if (props.schema.required) {
			model.value = 0
		} else {
			model.value = undefined
		}
	}

	const hours = Number(inputHours.value)
	const minutes = Number(inputMins.value)
	const seconds = Number(inputSeconds.value)

	if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
		return
	}

	model.value = hours * HOUR_DUR + minutes * MINUTE_DUR + seconds
}

function onBlur() {
	sendToModel()
	parseFromModel()
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

function clear() {
	model.value = undefined
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
