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
	IPCDynamicTypable,
	DynamicType,
	Directory,
	Command,
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
	provide,
	ComputedRef,
	inject,
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
import DynamicTypeInputVue from "../components/data/inputs/DynamicTypeInput.vue"
import DirectoryInputVue from "../components/data/inputs/DirectoryInput.vue"

import GenericDataViewVue from "../components/data/views/GenericDataView.vue"
import BooleanViewVue from "../components/data/views/BooleanView.vue"
import ColorViewVue from "../components/data/views/ColorView.vue"
import DurationViewVue from "../components/data/views/DurationView.vue"
import MediaFileViewVue from "../components/data/views/MediaFileView.vue"
import ObjectViewVue from "../components/data/views/ObjectView.vue"
import RangeViewVue from "../components/data/views/RangeView.vue"
import ResourceViewVue from "../components/data/views/ResourceView.vue"
import ToggleViewVue from "../components/data/views/ToggleView.vue"

import CommandInputVue from "../components/data/inputs/CommandInput.vue"
import CommandViewVue from "../components/data/views/CommandView.vue"

import { ipcRenderer } from "electron"
import { isObject } from "@vueuse/core"
import _cloneDeep from "lodash/cloneDeep"
import { ipcInvoke } from "./electron"

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

export function ipcParseSchemaDynamic<T>(ipcSchema: IPCDynamicTypable) {
	if (!ipcSchema.dynamicType) return {}
	if ("ipc" in ipcSchema.dynamicType) {
		const ipcPath = ipcSchema.dynamicType.ipc
		return {
			dynamicType: markRaw(async (context: any) => {
				const rawContext = _cloneDeep(context)
				try {
					const result = (await ipcRenderer.invoke(ipcPath, rawContext)) as IPCSchema
					return ipcParseSchema(result)
				} catch (err) {
					console.error("Error Invoking Dynamic Type", ipcPath, rawContext)
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
		return {
			...ipcSchema,
			...ipcParseSchemaDefault(ipcSchema),
			...ipcParseSchemaEnum(ipcSchema as IPCEnumable<any>),
			...ipcParseSchemaDynamic(ipcSchema as IPCDynamicTypable),
			type,
		}
	}
}

export function ipcParseDynamicSchema(ipcSchema: IPCSchema | string): Schema | ((...args: any[]) => Promise<Schema>) {
	if (typeof ipcSchema == "string") {
		return markRaw(async (...args: any[]) => {
			console.log("Invoking", ipcSchema)
			const schema = await ipcInvoke(ipcSchema, ...args)
			console.log("Result", schema)
			return ipcParseSchema(schema)
		})
	} else {
		return ipcParseSchema(ipcSchema)
	}
}

export const useDataInputStore = defineStore("data-components", () => {
	const componentMap = ref<Map<DataConstructorOrFactory, Component>>(new Map())
	const viewMap = ref<Map<DataConstructorOrFactory, Component>>(new Map())

	function registerInputComponent(type: DataConstructorOrFactory, component: Component) {
		componentMap.value.set(markRaw(type), markRaw(component))
	}

	function registerViewComponent(type: DataConstructorOrFactory, component: Component) {
		viewMap.value.set(markRaw(type), markRaw(component))
	}

	function getInputComponent(type: DataConstructorOrFactory) {
		return componentMap.value.get(type)
	}

	function getViewComponent(type: DataConstructorOrFactory) {
		return viewMap.value.get(type)
	}

	return { registerInputComponent, registerViewComponent, getInputComponent, getViewComponent }
})

export function useDataComponent(type: MaybeRefOrGetter<DataConstructorOrFactory>) {
	const inputStore = useDataInputStore()

	return computed(() => inputStore.getInputComponent(toValue(type)))
}

export function useDataViewComponent(type: MaybeRefOrGetter<DataConstructorOrFactory>) {
	const inputStore = useDataInputStore()

	return computed(() => inputStore.getViewComponent(toValue(type)))
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
	inputStore.registerInputComponent(DynamicType, DynamicTypeInputVue)
	inputStore.registerInputComponent(Directory, DirectoryInputVue)
	inputStore.registerInputComponent(Command, CommandInputVue)

	inputStore.registerViewComponent(String, GenericDataViewVue)
	inputStore.registerViewComponent(Number, GenericDataViewVue)
	inputStore.registerViewComponent(Object, ObjectViewVue)
	inputStore.registerViewComponent(Range, RangeViewVue)
	inputStore.registerViewComponent(MediaFile, MediaFileViewVue)
	inputStore.registerViewComponent(ResourceProxyFactory, ResourceViewVue)
	inputStore.registerViewComponent(Toggle, ToggleViewVue)
	inputStore.registerViewComponent(Color, ColorViewVue)
	inputStore.registerViewComponent(Duration, DurationViewVue)
	inputStore.registerViewComponent(Command, CommandViewVue)
}

export function provideDataContextSchema(schema: MaybeRefOrGetter<Schema>) {
	const schemaRef = computed(() => toValue(schema))

	provide("data-context", schemaRef)
}

export function injectDataContextSchema(): ComputedRef<Schema> {
	const dummyRef = computed<Schema>(() => markRaw({ type: Object, properties: {} }))

	return inject("data-context", dummyRef)
}
