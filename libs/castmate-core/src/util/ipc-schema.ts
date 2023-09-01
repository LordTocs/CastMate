import { Enumable, IPCSchema, Schema, SchemaObj, SchemaType, getTypeByConstructor } from "castmate-schema"
import { isResourceConstructor } from "../resources/resource"
import { isObject, isString } from "lodash"

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

export function deserializeSchema<TSchema extends Schema>(
	schema: TSchema,
	value: SchemaType<TSchema>
): SchemaType<TSchema> {
	if (schema.type === Object && "properties" in schema && isObject(value)) {
		const objValue: Record<string, any> = value
		const copyValue: Record<string, any> = {}
		for (const key of Object.keys(objValue)) {
			const propSchema = schema.properties[key]
			copyValue[key] = deserializeSchema(propSchema, objValue[key])
		}
		return copyValue as SchemaType<TSchema>
	} else if (schema.type === Array && "items" in schema && Array.isArray(value)) {
		const arrValue: Array<any> = value
		return arrValue.map((i) => deserializeSchema(schema.items, i)) as SchemaType<TSchema>
	} else if (isResourceConstructor(schema.type) && isString(value)) {
		return schema.type.storage.getById(value)
	} else {
		return value
	}
}
