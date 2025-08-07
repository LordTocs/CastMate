import { set } from "@vueuse/core"
import { get } from "node:http"
import { computed, MaybeRefOrGetter, Ref } from "vue"

export function usePropModel<T extends object, P extends keyof T>(model: Ref<T>, prop: P) {
	return computed({
		get() {
			return model.value[prop]
		},
		set(v) {
			model.value[prop] = v
		},
	})
}

export function useDefaultableModel<T extends object, P extends keyof T, PD extends T[P]>(
	model: Ref<T | undefined>,
	prop: P,
	propDefault: PD,
	defaultMaker: () => T
) {
	return computed({
		get() {
			return model.value?.[prop] ?? propDefault
		},
		set(v) {
			if (model.value == null) {
				const newValue = defaultMaker()
				newValue[prop] = v
				model.value = newValue
			} else {
				model.value[prop] = v
			}
		},
	})
}

export function useOptionalDefaultableModel<T extends object, P extends keyof T>(
	model: Ref<T | undefined>,
	prop: P,
	defaultMaker: () => T
) {
	return computed({
		get() {
			return model.value?.[prop]
		},
		set(v) {
			if (!v) {
				model.value = undefined
				return
			}

			if (model.value == null) {
				const newValue = defaultMaker()
				newValue[prop] = v
				model.value = newValue
			} else {
				model.value[prop] = v
			}
		},
	})
}
