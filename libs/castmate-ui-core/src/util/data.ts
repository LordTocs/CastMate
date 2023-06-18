import { type Schema, type IPCSchema, getTypeByName } from "castmate-schema"
import { defineStore } from "pinia"
import {
	type Component,
	type ComponentPublicInstance,
	type AsyncComponentLoader,
	type AsyncComponentOptions,
	defineAsyncComponent,
	ref,
} from "vue"

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

export const useDataInputs = defineStore("data-components", () => {
	const componentMap = ref<Map<string, Component>>(new Map())

	function registerInputComponent<
		T extends Component = {
			new (): ComponentPublicInstance
		}
	>(type: string, source: AsyncComponentLoader<T> | AsyncComponentOptions<T>) {
		componentMap.value.set(type, defineAsyncComponent(source))
	}

	function getInputComponent(type: string) {
		return componentMap.value.get(type)
	}

	return { registerInputComponent, getInputComponent }
})
