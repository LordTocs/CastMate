import { Enumable, IPCSchema, Schema, getTypeByConstructor } from "castmate-schema"
import { isResourceConstructor } from "../resources/resource"

function convertIPCEnum(schema: Enumable<any>) {
	if (schema.enum) {
		return { enum: "TODO MAKE THIS WORK" }
	} else {
		return {}
	}
}

export function ipcConvertSchema<T extends Schema>(schema: T): IPCSchema {
	//TODO: Ensure enums are converted to ipcFuncs
	//TODO: Connect reactive defaults

	if (schema.type === Object && "properties" in schema) {
		const properties: Record<string, any> = {}

		for (let key in schema.properties) {
			properties[key] = ipcConvertSchema(schema.properties[key])
		}

		return { ...schema, properties, type: "Object" }
	} else if (schema.type === Array && "items" in schema) {
		return {
			...schema,
			type: "Array",
			items: ipcConvertSchema(schema.items),
		}
	} else if (isResourceConstructor(schema.type)) {
		return {
			...schema,
			type: "Resource",
			resourceType: schema.type.storage.name,
		}
	} else {
		const typeName = getTypeByConstructor(schema.type)?.name
		if (!typeName) {
			console.error("Unconvertable Schema Type: ", schema)
			throw new Error("Unconvertable Schema Type")
		}
		return { ...schema, ...convertIPCEnum(schema as Enumable<any>), type: typeName }
	}
}
