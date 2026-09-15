import { getSchemaMetaData, Schema } from "castmate-schema"
import { toValue, computed, MaybeRefOrGetter } from "vue"

export function useValidator<T>(value: MaybeRefOrGetter<T>, schema: MaybeRefOrGetter<Schema>) {
	return computed<string | undefined>(() => {
		const schemaV = toValue(schema)
		const validatorFunc = undefined //getSchemaMetaData(schemaV.type)?.validate

		//if (!validatorFunc) return undefined
		//return validatorFunc(toValue(value), schemaV)
		return undefined
	})
}
