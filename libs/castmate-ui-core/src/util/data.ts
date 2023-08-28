import { type Schema, type IPCSchema, getTypeByName, DataConstructorOrFactory, Range, MediaFile } from "castmate-schema"
import { defineStore } from "pinia"
import {
	type Component,
	ref,
	computed,
	type MaybeRef,
	type MaybeRefOrGetter,
	unref,
	shallowReactive,
	shallowReadonly,
	toValue,
	markRaw,
	toRaw,
} from "vue"

import StringInputVue from "../components/data/inputs/StringInput.vue"
import NumberInputVue from "../components/data/inputs/NumberInput.vue"
import ObjectInputVue from "../components/data/inputs/ObjectInput.vue"
import RangeInputVue from "../components/data/inputs/RangeInput.vue"
import MediaFileInput from "../components/data/inputs/MediaFileInput.vue"
import ResourceInputVue from "../components/data/inputs/ResourceInput.vue"

export type ResourceProxy = string
const ResourceProxyFactory = {
	factoryCreate() {
		return ""
	},
}

declare module "castmate-schema" {
	interface SchemaResource {
		resourceType: string
	}
}

export function ipcParseSchema(ipcSchema: IPCSchema): Schema {
	if (ipcSchema.type === "Object" && "properties" in ipcSchema) {
		const properties: Record<string, Schema> = {}

		for (let prop in ipcSchema.properties) {
			properties[prop] = ipcParseSchema(ipcSchema.properties[prop])
		}

		return { ...ipcSchema, type: Object, properties }
	} else if (ipcSchema.type === "Array" && "items" in ipcSchema) {
		return {
			...ipcSchema,
			type: toRaw(Array),
			items: ipcParseSchema(ipcSchema.items),
		}
	} else if (ipcSchema.type === "Resource" && "resourceType" in ipcSchema) {
		return {
			...ipcSchema,
			type: toRaw(ResourceProxyFactory),
			resourceType: ipcSchema.resourceType,
		}
	} else {
		const type = toRaw(getTypeByName(ipcSchema.type)?.constructor)
		if (!type) {
			throw new Error(`Unknown IPC Type ${ipcSchema.type}`)
		}

		//@ts-ignore
		return { ...ipcSchema, type }
	}
}

export const useDataInputStore = defineStore("data-components", () => {
	const componentMap = ref<Map<DataConstructorOrFactory, Component>>(new Map())

	function registerInputComponent(type: DataConstructorOrFactory, component: Component) {
		componentMap.value.set(markRaw(type), markRaw(component))
	}

	function getInputComponent(type: DataConstructorOrFactory) {
		return componentMap.value.get(type)
	}

	return { registerInputComponent, getInputComponent }
})

export function useDataComponent(type: MaybeRefOrGetter<DataConstructorOrFactory>) {
	const inputStore = useDataInputStore()

	return computed(() => inputStore.getInputComponent(toValue(type)))
}

export function initData() {
	const inputStore = useDataInputStore()

	inputStore.registerInputComponent(String, StringInputVue)
	inputStore.registerInputComponent(Number, NumberInputVue)
	inputStore.registerInputComponent(Object, ObjectInputVue)
	inputStore.registerInputComponent(Range, RangeInputVue)
	inputStore.registerInputComponent(MediaFile, MediaFileInput)
	inputStore.registerInputComponent(ResourceProxyFactory, ResourceInputVue)
}
