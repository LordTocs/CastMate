import { MaybeRefOrGetter, computed, toValue } from "vue"

export interface InputSelection {
	start: number | null
	end: number | null
	direction: "forward" | "backward" | "none" | null
}

export interface PartialSelectionResult {
	start: number
	end: number
}

export function useCombinedPartialSelects(...partials: MaybeRefOrGetter<PartialSelectionResult | null | undefined>[]) {
	return computed(() => {
		const values = partials.map((p) => toValue(p))

		let min = Number.MAX_SAFE_INTEGER
		let max = Number.MIN_SAFE_INTEGER

		console.log(values.map((v) => (v ? { min: v.start, max: v.end } : null)))
		for (const v of values) {
			if (!v) continue
			min = Math.min(v.start, min)
			max = Math.max(v.end, max)
		}

		if (min > max) {
			return undefined
		}

		return { start: min, end: max }
	})
}
