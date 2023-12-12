import { Schema, getTypeByConstructor } from "castmate-schema"
import { toValue, computed, MaybeRefOrGetter } from "vue"

export function useValidator<T>(value: MaybeRefOrGetter<T>, schema: MaybeRefOrGetter<Schema>) {
	return computed<string | undefined>(() => {
		const schemaV = toValue(schema)
		const validatorFunc = getTypeByConstructor(schemaV.type)?.validate

		if (!validatorFunc) return undefined
		return validatorFunc(toValue(value), schemaV)
	})
}
