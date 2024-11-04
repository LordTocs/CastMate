import { MaybeRefOrGetter, UnwrapRef, computed, ref, toValue, watch } from "vue"

export interface IDHaver {
	id: string
}

export function useOrderedRefs<ElemType>(items: MaybeRefOrGetter<IDHaver[]>) {
	const orderedElements = ref<ElemType[]>([])

	watch(
		() => toValue(items).length,
		(newLength) => {
			//console.log("New ordered length", newLength)
			orderedElements.value.length = newLength
		}
	)

	function setRef(index: number, elem: UnwrapRef<ElemType> | null) {
		const itemValues = toValue(items)
		if (index > itemValues.length) return
		if (elem == null) return
		//console.log("Set Elem", index, elem)
		orderedElements.value[index] = elem as any
	}

	const elemsComputed = computed(() => orderedElements.value)

	return { orderedElements: elemsComputed, setRef }
}
