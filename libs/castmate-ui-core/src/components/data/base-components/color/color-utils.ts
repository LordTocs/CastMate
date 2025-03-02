import { Color } from "castmate-schema"
import { computed, Ref } from "vue"

import * as chromatism from "chromatism2"

export function useColorProperties(color: Ref<Color | undefined>) {
	const rgb = computed(() => {
		if (!color.value) return { r: 255, g: 255, b: 255 }
		return chromatism.convert(color.value).rgb
	})

	const hsv = computed(() => {
		if (!color.value) return { h: 0, s: 0, v: 100 }
		return chromatism.convert(color.value).hsv
	})

	const red = computed({
		get() {
			return rgb.value.r
		},
		set(v) {
			//@ts-ignore
			color.value = chromatism.convert({ ...rgb.value, r: v }).hex
		},
	})

	const green = computed({
		get() {
			return rgb.value.g
		},
		set(v) {
			//@ts-ignore
			color.value = chromatism.convert({ ...rgb.value, g: v }).hex
		},
	})

	const blue = computed({
		get() {
			return rgb.value.b
		},
		set(v) {
			//@ts-ignore
			color.value = chromatism.convert({ ...rgb.value, b: v }).hex
		},
	})

	const hue = computed({
		get() {
			return Math.round(hsv.value.h)
		},
		set(v) {
			//@ts-ignore
			color.value = chromatism.convert({ ...hsv.value, h: v }).hex
		},
	})

	const sat = computed({
		get() {
			return Math.round(hsv.value.s)
		},
		set(v) {
			//@ts-ignore
			color.value = chromatism.convert({ ...hsv.value, s: v }).hex
		},
	})

	const val = computed({
		get() {
			return Math.round(hsv.value.v)
		},
		set(v) {
			//@ts-ignore
			color.value = chromatism.convert({ ...hsv.value, v: v }).hex
		},
	})

	return { red, green, blue, hue, sat, val }
}
