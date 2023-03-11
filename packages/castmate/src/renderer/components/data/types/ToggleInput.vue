<template>
	<v-input v-model="modelObj" class="v-switch" :density="props.density">
		<div class="toggle-control">
			<v-label
				style="padding-inline-start: 0px; padding-inline-end: 10px"
			>
				{{ props.schema?.leftLabel }}
			</v-label>
			<div class="toggle-control-wrapper">
				<div class="v-switch__track">
					<div class="track-section" @click="modelObj = false"></div>
					<div
						class="track-section"
						@click="modelObj = 'toggle'"
					></div>
					<div class="track-section" @click="modelObj = true"></div>
				</div>
				<div
					class="toggle-control-thumb-holder"
					:class="{
						'toggle-control-on': props.modelValue === true,
						'toggle-control-off': props.modelValue === false,
						'toggle-control-switch': props.modelValue === 'toggle',
						'toggle-control-indeterminate': indeterminate
					}"
					@click="cycleInput"
					v-ripple
				>
					<div class="v-switch__thumb">
						<v-icon
							v-if="thumbIcon && !indeterminate"
							style="color: white"
							:icon="thumbIcon"
							size="x-small"
						/>
					</div>
				</div>
			</div>
			<v-label>
				{{ props.label }}
			</v-label>
			<v-btn
				class="ml-1"
				v-if="clearable"
				size="x-small"
				variant="tonal"
				:disabled="props.modelValue == null"
				@click="modelObj=undefined"
				icon="mdi-close"
			/>
		</div>
	</v-input>
</template>

<script setup>
import { computed } from "vue"
import { useModel } from "../../../utils/modelValue"

const props = defineProps({
	modelValue: {},
	inset: {},
	schema: {},
	context: {},
	secret: { type: Boolean },
	colorRefs: {},
	label: { type: String },
	density: { type: String },
})

const emit = defineEmits(["update:modelValue"])

const modelObj = useModel(props, emit)

const clearable = computed(() => !props.schema?.required)

const indeterminate = computed(() => props.modelValue == null)

const falseIcon = computed(() => props.schema?.falseIcon ?? "mdi-close-thick")
const trueIcon = computed(() => props.schema?.trueIcon ?? "mdi-check-bold")
const toggleIcon = computed(() => props.schema?.toggleIcon ?? "mdi-swap-horizontal")

const thumbIcon = computed(() => {
	if (props.modelValue === "toggle") return toggleIcon.value
	if (props.modelValue === true) return trueIcon.value
	if (!props.modelValue) return falseIcon.value
})

function cycleInput() {
	if (!props.modelValue) {
		modelObj.value = "toggle"
	} else if (props.modelValue === "toggle") {
		modelObj.value = true
	} else if (props.modelValue === true) {
		modelObj.value = false
	}
}
</script>

<style scoped>
.v-switch__track {
	width: 72px;
	display: flex;
}

.toggle-control-thumb-holder {
	position: absolute;
	transition: 0.15s transform cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-control {
	align-items: center;
	contain: layout;
	display: flex;
	flex: 1 0;
	grid-area: control;
	position: relative;
	user-select: none;
}

.toggle-control-wrapper {
	display: flex;
	align-items: center;
	position: relative;
	justify-content: center;
	flex: none;
	width: auto;
}

.track-section {
	flex: 1;
}

.toggle-control-on {
	transform: translateX(28px);
}

.toggle-control-off {
	transform: translateX(-28px);
}

.toggle-control-switch {
	transform: translateX(0px);
}

.toggle-control-indeterminate {
	transform: translateX(0px);
    transform: scale(0.6);
    box-shadow: none;
}
</style>
