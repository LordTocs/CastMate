<template>
	<div class="v-color-picker-preview light-color-preview">
		<div class="v-color-picker-preview__dot">
			<div :style="{ backgroundColor: previewColor }"></div>
		</div>
		<div class="v-color-picker-preview__sliders">
			<v-slider
                class="light-color-brightness-slider"
                :style="{
                    '--light-color-low-brightness': lowColor,
                    '--light-color-high-brightness': highColor,
                }"
				v-model="bri"
				min="0"
				max="100"
				step="0"
				thumb-size="14"
				track-size="8"
				hide-details
				track-fill-color="white"
			/>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue"
import { kelvinToCSS } from "../../utils/color"
import * as chromatism from "chromatism2"
const props = defineProps({
	modelValue: {},
	lightType: { type: String },
})

const emit = defineEmits(["update:modelValue"])

function stripTemperature(obj) {
    delete obj?.kelvin
    return obj
}

function stripColor(obj) {
    delete obj?.hue
    delete obj?.sat
    return obj
}

const hue = computed({
    get() {
        if (props.lightType != 'color') {
            return 0
        }

        return props.modelValue?.hue ?? 0
    },
    set(newHue) {
        emit("update:modelValue", stripTemperature({ ...props.modelValue, hue: newHue}))
    }
})

const sat = computed({
    get() {
        if (props.lightType != 'color') {
            return 0
        }

        return props.modelValue?.sat ?? 0
    },
    set(newSat) {
        emit("update:modelValue", stripTemperature({ ...props.modelValue, sat: newSat}))
    }
})

const kelvin = computed({
    get() {
        if (props.lightType != 'temperature') {
            return 0
        }

        return props.modelValue?.kelvin ?? 4000
    },
    set(newKelvin) {
        emit("update:modelValue", stripColor({ ...props.modelValue, kelvin: newKelvin}))
    }
})

const bri = computed({
	get() {
		return props.modelValue?.bri ?? 100
	},
	set(newBri) {
		emit("update:modelValue", { ...props.modelValue, bri: newBri })
	},
})

const previewColor = computed(() => {
    if (!props.modelValue) return 'black'

    if (props.lightType == 'color') {
        return chromatism.convert({ h: hue.value, s: sat.value, v: bri.value}).cssrgb
    } else if (props.lightType == 'temperature') {
        return kelvinToCSS(kelvin.value, bri.value)
    }
})

const lowColor = computed(() => {
    if (!props.modelValue) return 'black'
    if (props.lightType == 'color') {
        return chromatism.convert({ h: hue.value, s: sat.value, v: 0}).cssrgb
    } else if (props.lightType == 'temperature') {
        return kelvinToCSS(kelvin.value, 0)
    }
})

const highColor = computed(() => {
    if (!props.modelValue) return 'black'
    if (props.lightType == 'color') {
        return chromatism.convert({ h: hue.value, s: sat.value, v: 100}).cssrgb
    } else if (props.lightType == 'temperature') {
        return kelvinToCSS(kelvin.value, 100)
    }
})
</script>


<style>
.light-color-preview .light-color-brightness-slider .v-slider-track__background {
    background-image: linear-gradient(to right, var(--light-color-low-brightness), var(--light-color-high-brightness));
}

.light-color-preview .light-color-brightness-slider .v-slider-track__fill {
    display: none;
}
</style>