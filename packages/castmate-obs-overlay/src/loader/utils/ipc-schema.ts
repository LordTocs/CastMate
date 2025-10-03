import { getTypeByName, IPCDefaultable, IPCDynamicTypable, IPCEnumable, IPCSchema, Schema } from "castmate-schema"
import { markRaw, toRaw } from "vue"

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
				console.error("Overlays can't use IPC enums")
				return []
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
				console.error("Overlays can't use IPC types")
				return []
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
				console.error("Overlays can't use IPC defaults")
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

export const ResourceProxyFactory = {
	factoryCreate() {
		return ""
	},
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
			throw new Error("Overlays can't get dynamic schemas!")
		})
	} else {
		return ipcParseSchema(ipcSchema)
	}
}
