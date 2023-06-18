import { Enumable, IPCSchema, Schema, getTypeByConstructor } from "castmate-schema"

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
	} else {
		const typeName = getTypeByConstructor(schema.type)?.name
		if (!typeName) {
			throw new Error("Unconvertable Schema Type")
		}
		return { ...schema, ...convertIPCEnum(schema as Enumable<any>), type: typeName }
	}
}
