<template>
    <p v-if="modelValue">
		<span class="text--secondary" v-if="props.schema.name || props.label">
			{{ props.schema.name || label }}:
		</span>
		<div class="swatch" v-if="!isTemplated" :style="{backgroundColor: previewColor}">
        </div>
        <div class="swatch templated" v-else>
            <v-icon icon="mdi-code-braces" size="small" style="width: 3em"/>
        </div>
	</p>
</template>

<script setup>
import { computed } from 'vue';
import { kelvinToCSS } from '../../../utils/color';
import * as chromatism from "chromatism2"

const props = defineProps({
	modelValue: { },
	schema: {},
	label: { type: String },
})

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
			if ("hue" in props.modelValue || "sat" in props.modelValue) {
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
const kelvin = computed(() => props.modelValue?.kelvin ?? 0)

const previewColor = computed(() => {
	if (!props.modelValue) return "black"

	if (lightType.value == "color") {
		return chromatism.convert({ h: hue.value, s: sat.value, v: bri.value })
			.cssrgb
	} else if (lightType.value == "temperature") {
		return kelvinToCSS(kelvin.value)
	}
})

</script>

<style scoped>
.swatch {
    height: 1.5em;
    width: 4em;
    line-height: 1.5em;
    border-radius: 3px;
    display: inline-block;
}

.templated {
    background-image: linear-gradient(to right, #d654ff, #0860ff);
}
</style>