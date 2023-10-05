import {
	type Schema,
	type IPCSchema,
	getTypeByName,
	DataConstructorOrFactory,
	Range,
	MediaFile,
	Toggle,
	Color,
	Duration,
	EnumItem,
	IPCEnumable,
	IPCDefaultable,
} from "castmate-schema"
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
import ToggleInputVue from "../components/data/inputs/ToggleInput.vue"
import BooleanInputVue from "../components/data/inputs/BooleanInput.vue"
import ColorInputVue from "../components/data/inputs/ColorInput.vue"
import DurationInputVue from "../components/data/inputs/DurationInput.vue"
import { ipcRenderer } from "electron"
import { isObject } from "@vueuse/core"

export type ResourceProxy = string
export const ResourceProxyFactory = {
	factoryCreate() {
		return ""
	},
}

declare module "castmate-schema" {
	interface SchemaResource {
		resourceType: string
	}
}
export function ipcParseSchemaEnum<T>(ipcSchema: IPCEnumable<T>) {
	if (!ipcSchema.enum) return {}
	if (Array.isArray(ipcSchema.enum)) {
		return { enum: ipcSchema.enum }
	} else if ("ipc" in ipcSchema.enum) {
		const ipcPath = ipcSchema.enum.ipc
		return {
			enum: markRaw(async (context: any) => {
				try {
					return await ipcRenderer.invoke(ipcPath, toRaw(context))
				} catch (err) {
					console.error("Error Invoking Enum", ipcPath)
					console.error(err)
					return []
				}
			}),
		}
	}
}

export function ipcParseSchemaDefault<T>(ipcSchema: IPCDefaultable<T>) {
	if (ipcSchema.default == undefined) return { default: undefined }
	if (typeof ipcSchema.default === "object" && "ipc" in ipcSchema.default) {
		const ipcPath = ipcSchema.default.ipc
		return {
			default: markRaw(async (): Promise<T> => {
				try {
					return await ipcRenderer.invoke(ipcPath)
				} catch (err) {
					console.error("Error Invoking Default", ipcPath)
					console.error(err)
				}
				//I'm so tired.
				return undefined as unknown as T
			}),
		}
	} else {
		return {
			default: ipcSchema.default as T,
		}
	}
}

export function ipcParseSchema(ipcSchema: IPCSchema): Schema {
	if (ipcSchema.type === "Object" && "properties" in ipcSchema) {
		const properties: Record<string, Schema> = {}

		for (let prop in ipcSchema.properties) {
			properties[prop] = ipcParseSchema(ipcSchema.properties[prop])
		}

		return { ...ipcSchema, ...ipcParseSchemaDefault(ipcSchema), type: Object, properties }
	} else if (ipcSchema.type === "Array" && "items" in ipcSchema) {
		return {
			...ipcSchema,
			type: markRaw(Array),
			items: ipcParseSchema(ipcSchema.items),
			...ipcParseSchemaDefault(ipcSchema),
		}
	} else if (ipcSchema.type === "Resource" && "resourceType" in ipcSchema) {
		return {
			...ipcSchema,
			type: markRaw(ResourceProxyFactory),
			...ipcParseSchemaDefault(ipcSchema),
			resourceType: ipcSchema.resourceType,
		}
	} else {
		const type = toRaw(getTypeByName(ipcSchema.type)?.constructor)
		if (!type) {
			throw new Error(`Unknown IPC Type ${ipcSchema.type}`)
		}

		//@ts-ignore
		return { ...ipcSchema, ...ipcParseSchemaDefault(ipcSchema), ...ipcParseSchemaEnum(ipcSchema), type }
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
	inputStore.registerInputComponent(Toggle, ToggleInputVue)
	inputStore.registerInputComponent(Boolean, BooleanInputVue)
	inputStore.registerInputComponent(Color, ColorInputVue)
	inputStore.registerInputComponent(Duration, DurationInputVue)
}
