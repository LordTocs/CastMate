import { defineStore } from "pinia"
import { useIpcCaller } from "../main"
import { computed, MaybeRefOrGetter, ref, toValue } from "vue"

const mainCreateSlotBinding = useIpcCaller<(slotId: string, type: string, name: string) => any>(
	"satellite",
	"createSlotBinding"
)
const mainDeleteSlotBinding = useIpcCaller<(slotId: string) => any>("satellite", "deleteSlotBinding")
const mainBindResourceSlot = useIpcCaller<(slotId: string, resourceId: string | undefined) => any>(
	"satellite",
	"bindResourceSlot"
)

const mainGetSatelliteResourceSlotHandlerTypes = useIpcCaller<() => string[]>(
	"satellite",
	"getSatelliteResourceSlotHandlerTypes"
)

interface ResourceSlotBinding {
	id: string
	name: string
	resourceType: string
	resourceId?: string
}

export const useSatelliteResourceStore = defineStore("satellite-resource-store", () => {
	const slotBindings = ref(new Map<string, ResourceSlotBinding>())

	const slotHandlerTypes = ref(new Array<string>())

	async function initialize() {
		slotHandlerTypes.value = await mainGetSatelliteResourceSlotHandlerTypes()
		console.log("HANDLER TYPES", slotHandlerTypes.value)
	}

	async function createSlotBinding(slotId: string, type: string, name: string) {
		await mainCreateSlotBinding(slotId, type, name)
		slotBindings.value.set(slotId, {
			name,
			id: slotId,
			resourceType: type,
		})
	}

	async function deleteSlotBinding(slotId: string) {
		await mainDeleteSlotBinding(slotId)
		slotBindings.value.delete(slotId)
	}

	async function bindResourceToSlot(slotId: string, resourceId: string | undefined) {
		console.log("BINDING!")
		await mainBindResourceSlot(slotId, resourceId)
		console.log("DONE BINDING")
		const binding = slotBindings.value.get(slotId)
		if (binding) {
			console.log("Setting Resource ID!", resourceId)
			binding.resourceId = resourceId
		} else {
			console.error("MISSING SLOT!", slotId, [...slotBindings.value.keys()])
		}
	}

	return {
		slotBindings: computed(() => slotBindings.value),
		createSlotBinding,
		deleteSlotBinding,
		bindResourceToSlot,
		slotHandlerTypes: computed(() => slotHandlerTypes.value),
		initialize,
	}
})

export function useResourceSlotBinding(slotId: MaybeRefOrGetter<string>) {
	const store = useSatelliteResourceStore()

	return computed(() => {
		return store.slotBindings.get(toValue(slotId))
	})
}

export function useResourceSlotBindingModel(slotId: MaybeRefOrGetter<string>) {
	const store = useSatelliteResourceStore()

	return computed({
		get() {
			return store.slotBindings.get(toValue(slotId))?.resourceId
		},
		set(v) {
			store.bindResourceToSlot(toValue(slotId), v)
		},
	})
}
