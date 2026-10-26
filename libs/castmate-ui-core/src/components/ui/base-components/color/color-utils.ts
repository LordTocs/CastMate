import { Color, isHexColor } from "castmate-schema"
import { computed, ref, Ref, watch } from "vue"
import { tryOnMounted } from "@vueuse/core"
import * as chromatism from "chromatism2"

const defaultRGB = () => ({ r: 255, g: 255, b: 255 })
const defaultHSV = () => ({ h: 0, s: 0, v: 100 })

export function useColorProperties(color: Ref<Color | undefined>, withAlpha: boolean = false) {
	const rgb = ref<{ r: number; g: number; b: number }>(defaultRGB())
	const hsv = ref<{ h: number; s: number; v: number }>(defaultHSV())
	const alphaInternal = ref<number>(255)

	function convertToHexAlpha(value: chromatism.ColourModes.Any): Color | undefined {
		const hex = chromatism.convert(value).hex

		if (!withAlpha) return hex as Color
		return `${hex}${Math.round(alphaInternal.value).toString(16).padStart(2, "0").toUpperCase()}` as Color
	}

	tryOnMounted(() => {
		watch(
			color,
			() => {
				if (!color.value || !isHexColor(color.value)) {
					rgb.value = defaultRGB()
					hsv.value = defaultHSV()
					alphaInternal.value = 1
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

				if (color.value.length > 7) {
					alphaInternal.value = parseInt(color.value.slice(7, 10), 16)
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

			color.value = convertToHexAlpha({ ...rgb.value })
		},
	})

	const green = computed({
		get() {
			return Math.round(rgb.value.g)
		},
		set(v) {
			rgb.value.g = v
			color.value = convertToHexAlpha({ ...rgb.value })
		},
	})

	const blue = computed({
		get() {
			return Math.round(rgb.value.b)
		},
		set(v) {
			rgb.value.b = v
			color.value = convertToHexAlpha({ ...rgb.value })
		},
	})

	const hue = computed({
		get() {
			return Math.round(hsv.value.h)
		},
		set(v) {
			hsv.value.h = v
			color.value = convertToHexAlpha({ ...hsv.value })
		},
	})

	const sat = computed({
		get() {
			return Math.round(hsv.value.s)
		},
		set(v) {
			hsv.value.s = v
			color.value = convertToHexAlpha({ ...hsv.value })
		},
	})

	const val = computed({
		get() {
			return Math.round(hsv.value.v)
		},
		set(v) {
			hsv.value.v = v

			color.value = convertToHexAlpha({ ...hsv.value })
		},
	})

	const alpha = computed<number>({
		get() {
			return Math.round(alphaInternal.value)
		},
		set(v) {
			alphaInternal.value = v
			color.value = convertToHexAlpha({ ...rgb.value })
		},
	})

	return { red, green, blue, hue, sat, val, alpha }
}
