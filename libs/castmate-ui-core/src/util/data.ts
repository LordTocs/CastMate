import { type Schema, type IPCSchema, getTypeByName } from "castmate-schema"
import { defineStore } from "pinia"
import {
	type Component,
	type ComponentPublicInstance,
	type AsyncComponentLoader,
	type AsyncComponentOptions,
	defineAsyncComponent,
	ref,
	computed,
	type MaybeRef,
	unref,
} from "vue"

import StringInputVue from "../components/data/inputs/StringInput.vue"
import NumberInputVue from "../components/data/inputs/NumberInput.vue"
import ObjectInputVue from "../components/data/inputs/ObjectInput.vue"

export interface DataInputCommonProps<SchemaType> {
	schema: SchemaType
	context: any
	secret: boolean
	density: "default" | "comfortable" | "compact" //From vuetify
}

class ResourceProxy {
	id: string

	constructor() {
		this.id = "HELLO?"
	}
}
interface ResourceProxy {
	id: string
}

declare module "castmate-schema" {
	interface SchemaResource {
		resourceId: string
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
			type: Array,
			items: ipcParseSchema(ipcSchema.items),
		}
	} else if (ipcSchema.type === "Resource" && "resourceId" in ipcSchema) {
		return {
			...ipcSchema,
			type: ResourceProxy,
			resourceId: ipcSchema.resourceId,
		}
	} else {
		const type = getTypeByName(ipcSchema.type)?.constructor
		if (!type) {
			throw new Error(`Unknown IPC Type ${ipcSchema.type}`)
		}

		//@ts-ignore
		return { ...ipcSchema, type }
	}
}

export const useDataInputStore = defineStore("data-components", () => {
	const componentMap = ref<Map<string, Component>>(new Map())

	function registerInputComponent(type: new (...args: any[]) => any, component: Component) {
		componentMap.value.set(type.name, component)
	}

	function getInputComponent(type: new (...args: any[]) => any) {
		return componentMap.value.get(type.name)
	}

	return { registerInputComponent, getInputComponent }
})

export function useDataComponent(type: new (...args: any[]) => any) {
	const inputStore = useDataInputStore()

	return computed(() => inputStore.getInputComponent(type))
}

export function initData() {
	const inputStore = useDataInputStore()

	inputStore.registerInputComponent(String, StringInputVue)
	inputStore.registerInputComponent(Number, NumberInputVue)
	inputStore.registerInputComponent(Object, ObjectInputVue)
}
