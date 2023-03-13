<template>
	<v-menu
		v-model="menuOpen"
		:close-on-content-click="false"
		:contentProps="{ style: { minWidth: 'unset !important' } }"
	>
		<template #activator="{ props: activatorProps }">
			<v-input v-model="modelObj" :density="props.density">
				<v-field
					:label="props.label"
					:active="!!modelObj"
					:dirty="!!modelObj"
					:clearable="!schema?.required"
					@click:clear="modelObj = undefined"
				>
					<div
						class="v-field__input"
						v-bind="activatorProps"
						style="cursor: pointer"
					>
						<div
							v-if="modelObj && !isTemplated"
							class="swatch"
							:style="{ backgroundColor: previewColor }"
						></div>
						<div
							v-if="modelObj && isTemplated"
							class="swatch"
							style="
								background-image: linear-gradient(
									to right,
									#d654ff,
									#0860ff
								);
							"
						>
							<v-icon icon="mdi-code-braces" size="small" />
						</div>
					</div>
					<template #append-inner>
						<v-icon
							class="ml-1"
							v-if="canTemplate"
							size="x-small"
							icon="mdi-code-braces"
						/>
					</template>
				</v-field>
			</v-input>
		</template>
		<div @mousedown="cardClick">
			<v-card class="mx-1 my-1">
				<light-color-picker
					v-model="modelObj"
					:templatable="canTemplate"
				/>
				<select-dummy
					ref="dummySelect"
					@copy="copy"
					@cut="cut"
					@paste="paste"
				/>
			</v-card>
		</div>
	</v-menu>
</template>

<script setup>
import { computed, nextTick, ref, watch, onMounted } from "vue"
import { kelvinToCSS } from "../../../utils/color"
import * as chromatism from "chromatism2"
import LightColorPicker from "../../colors/LightColorPicker.vue"
import { useModel } from "../../../utils/modelValue"
import SelectDummy from "../../sequences/SelectDummy.vue"
import { isString } from "@vue/shared"

const props = defineProps({
	modelValue: {},
	label: { type: String },
	schema: {},
	density: { type: String },
})
const emit = defineEmits(["update:modelValue"])
const modelObj = useModel(props, emit)

const canTemplate = computed(() => !!props.schema?.template)

function isNumberOrNullish(value) {
	if (value == null || value == undefined) return true
	return value instanceof Number || typeof value === "number"
}

function isValueTemplated(value) {
	return !isNumberOrNullish(value)
}

const isTemplated = computed(() => {
	return (
		isValueTemplated(props.modelValue?.bri) ||
		isValueTemplated(props.modelValue?.sat) ||
		isValueTemplated(props.modelValue?.hue) ||
		isValueTemplated(props.modelValue?.kelvin)
	)
})

const lightType = computed({
	get() {
		if (props.modelValue) {
			if ("hue" in props.modelValue && "sat" in props.modelValue) {
				return "color"
			} else if ("kelvin" in props.modelValue) {
				return "temperature"
			}
		}

		return "color"
	},
})

const hue = computed(() => props.modelValue?.hue ?? 0)
const sat = computed(() => props.modelValue?.sat ?? 0)
const bri = computed(() => props.modelValue?.bri ?? 0)
const kelvin = computed(() => props.modelValue?.kelvin ?? 4000)

const previewColor = computed(() => {
	if (!props.modelValue) return "black"

	if (lightType.value == "color") {
		return chromatism.convert({ h: hue.value, s: sat.value, v: bri.value })
			.cssrgb
	} else if (lightType.value == "temperature") {
		return kelvinToCSS(kelvin.value, bri.value)
	}
})

const menuOpen = ref(false)
const dummySelect = ref(null)
watch(menuOpen, () => {
	if (menuOpen.value) {
		nextTick(() => {
			dummySelect.value.select()
		})
	}
})

function cardClick(ev) {
	//The inputs inside of the color picker don't stop propagation so ignore them here
	if (ev.target?.nodeName === "INPUT") return

	dummySelect.value?.select()
}

/**
 *
 * @param {ClipboardEvent} ev
 */
function copy(ev) {
	if (!modelObj.value) return

	ev.clipboardData.setData("application/json", JSON.stringify(modelObj.value))

	ev.preventDefault()
}

/**
 *
 * @param {ClipboardEvent} ev
 */
function paste(ev) {
	const value = ev.clipboardData.getData("application/json")

	try {
		const data = JSON.parse(value)

		if ("hue" in data || "sat" in data || "kelvin" in data) {
			modelObj.value = {
				...("hue" in data ? { hue: data.hue } : {}),
				...("sat" in data ? { sat: data.sat } : {}),
				...("kelvin" in data ? { kelvin: data.kelvin } : {}),
			}
		}
	} catch (err) {}
}

/**
 *
 * @param {ClipboardEvent} ev
 */
function cut(ev) {
	copy(ev)
	modelObj.value = undefined
}
</script>

<style scoped>
.preview {
	min-height: 43px;
	margin-top: 20px;
	margin-inline-start: var(--v-field-padding-start);
}

.swatch {
	width: 100%;
	height: calc(
		var(--v-input-control-height) -
			(var(--v-field-padding-top, 10px) + var(--v-input-padding-top, 0)) -
			8px
	);
	margin: 4px 0;
	border-radius: 3px;
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
}
</style>
