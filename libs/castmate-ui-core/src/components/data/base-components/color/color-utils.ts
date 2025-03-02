import { Color, isHexColor } from "castmate-schema"
import { computed, ref, Ref, watch } from "vue"
import { tryOnMounted } from "@vueuse/core"
import * as chromatism from "chromatism2"

const defaultRGB = () => ({ r: 255, g: 255, b: 255 })
const defaultHSV = () => ({ h: 0, s: 0, v: 100 })

export function useColorProperties(color: Ref<Color | undefined>) {
	const rgb = ref<{ r: number; g: number; b: number }>(defaultRGB())
	const hsv = ref<{ h: number; s: number; v: number }>(defaultHSV())

	tryOnMounted(() => {
		watch(
			color,
			() => {
				if (!color.value || !isHexColor(color.value)) {
					rgb.value = defaultRGB()
					hsv.value = defaultHSV()
					return
				}

				const converted = chromatism.convert(color.value)

				const rgbHexed = chromatism.convert(rgb.value).hex
				if (rgbHexed != color.value) {
					rgb.value = converted.rgb
				}

				const hsvHexed = chromatism.convert(hsv.value).hex
				if (hsvHexed != color.value) {
					hsv.value = converted.hsv
				}
			},
			{ immediate: true }
		)
	})

	const red = computed({
		get() {
			return Math.round(rgb.value.r)
		},
		set(v) {
			rgb.value.r = v

			//@ts-ignore
			color.value = chromatism.convert({ ...rgb.value }).hex
		},
	})

	const green = computed({
		get() {
			return Math.round(rgb.value.g)
		},
		set(v) {
			rgb.value.g = v

			//@ts-ignore
			color.value = chromatism.convert({ ...rgb.value }).hex
		},
	})

	const blue = computed({
		get() {
			return Math.round(rgb.value.b)
		},
		set(v) {
			rgb.value.b = v

			//@ts-ignore
			color.value = chromatism.convert({ ...rgb.value }).hex
		},
	})

	const hue = computed({
		get() {
			return Math.round(hsv.value.h)
		},
		set(v) {
			hsv.value.h = v

			//@ts-ignore
			color.value = chromatism.convert({ ...hsv.value }).hex
		},
	})

	const sat = computed({
		get() {
			return Math.round(hsv.value.s)
		},
		set(v) {
			hsv.value.s = v

			//@ts-ignore
			color.value = chromatism.convert({ ...hsv.value }).hex
		},
	})

	const val = computed({
		get() {
			return Math.round(hsv.value.v)
		},
		set(v) {
			hsv.value.v = v

			//@ts-ignore
			color.value = chromatism.convert({ ...hsv.value }).hex
		},
	})

	return { red, green, blue, hue, sat, val }
}
