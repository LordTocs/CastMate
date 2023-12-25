import {
	Defaultable,
	Enumable,
	IPCSchema,
	ResolvedSchemaType,
	Schema,
	SchemaBase,
	SchemaObj,
	SchemaType,
	getTypeByConstructor,
} from "castmate-schema"
import { ResourceBase, isResourceConstructor } from "../resources/resource"
import { isArray, isFunction, isObject, isString } from "lodash"
import { ipcMain } from "electron"

function convertIPCEnum(schema: Enumable<any>, path: string) {
	if (schema.enum) {
		if (isArray(schema.enum)) {
			return { enum: schema.enum }
		} else {
			return { enum: { ipc: `${path}_enum` } }
		}
	} else {
		return {}
	}
}
export interface PossiblyDynamic {
	dynamicType?(context: any): Promise<Schema>
}

function convertIPCDynamic(schema: PossiblyDynamic, path: string) {
	if (schema.dynamicType) {
		return { dynamicType: { ipc: `${path}_dynamicType` } }
	}
}

function registerIPCEnum(schema: Enumable<any>, path: string, topLevelSchema: Schema) {
	if (!schema.enum) return
	if (!isFunction(schema.enum)) return
	//console.log("Registering Schema IPC", `${path}_enum`)
	const enumFunc = schema.enum
	ipcMain.handle(`${path}_enum`, async (event, context) => {
		try {
			const parsedContext = await deserializeSchema(topLevelSchema, context)
			return (await enumFunc(parsedContext)).map((r) => serializeSchema(schema as Schema, r))
		} catch (err) {
			console.log("Error Invoking Enum IPC", path)
			console.error(err)
			return []
		}
	})
}

function registerIPCDynamic(schema: PossiblyDynamic, path: string, topLevelSchema: Schema) {
	if (!schema.dynamicType) return
	if (!isFunction(schema.dynamicType)) return
	//console.log("Registering Schema IPC", `${path}_enum`)
	const schemaFunc = schema.dynamicType
	ipcMain.handle(`${path}_dynamicType`, async (event, context) => {
		try {
			const parsedContext = await deserializeSchema(topLevelSchema, context)
			const schema = await schemaFunc(parsedContext)
			return ipcConvertSchema(schema, `${path}_dynamicTypeResult`)
		} catch (err) {
			console.log("Error Invoking DynamicType IPC", path)
			console.error(err)
			return []
		}
	})
}

function convertIPCDefault(schema: Schema, path: string) {
	if (schema.default) {
		if (isFunction(schema.default)) {
			return { default: { ipc: `${path}_default` } }
		} else {
			return { default: serializeSchema(schema, schema.default) }
		}
	}
}

function registerIPCDefault(schema: Schema, path: string) {
	if (!schema.default) return
	if (!isFunction(schema.default)) return

	const defaultFunc = schema.default
	//console.log("Registering Schema IPC", `${path}_default`)

	ipcMain.handle(`${path}_default`, async (event) => {
		try {
			return serializeSchema(schema, await defaultFunc())
		} catch (err) {
			console.log("Error Invoking Default IPC", path)
			console.error(err)
			return []
		}
	})
}

export function ipcRegisterSchema<T extends Schema>(schema: T, path: string, topLevelSchema?: Schema) {
	if (schema.type === Object && "properties" in schema) {
		for (let key in schema.properties) {
			ipcRegisterSchema(schema.properties[key], `${path}_${key}`, topLevelSchema ?? schema)
		}
	} else if (schema.type === Array && "items" in schema) {
		ipcRegisterSchema(schema.items, `${path}_items`, topLevelSchema ?? schema)
	} else if (isResourceConstructor(schema.type)) {
		registerIPCDefault(schema, path)
	} else {
		const typeName = getTypeByConstructor(schema.type)?.name
		if (!typeName) {
			console.error("Unconvertable Schema Type: ", schema)
			throw new Error("Unconvertable Schema Type")
		}
		registerIPCEnum(schema as Enumable<any>, path, topLevelSchema ?? schema)
		registerIPCDefault(schema, path)
		registerIPCDynamic(schema as PossiblyDynamic, path, topLevelSchema ?? schema)
	}
}

export function ipcConvertSchema<T extends Schema>(schema: T, path: string): IPCSchema {
	//TODO: Connect reactive defaults

	if (schema.type === Object && "properties" in schema) {
		const properties: Record<string, any> = {}

		for (let key in schema.properties) {
			properties[key] = ipcConvertSchema(schema.properties[key], `${path}_${key}`)
		}

		return { ...schema, ...convertIPCDefault(schema, path), properties, type: "Object" }
	} else if (schema.type === Array && "items" in schema) {
		return {
			...schema,
			...convertIPCDefault(schema, path),
			type: "Array",
			items: ipcConvertSchema(schema.items, `${path}_items`),
		}
	} else if (isResourceConstructor(schema.type)) {
		return {
			...schema,
			type: "Resource",
			resourceType: schema.type.storage.name,
			...convertIPCDefault(schema, path),
		}
	} else {
		const typeName = getTypeByConstructor(schema.type)?.name
		if (!typeName) {
			console.error("Unconvertable Schema Type: ", schema)
			throw new Error("Unconvertable Schema Type")
		}
		return {
			...schema,
			...convertIPCDefault(schema, path),
			...convertIPCEnum(schema as Enumable<any>, path),
			...convertIPCDynamic(schema as PossiblyDynamic, path),
			type: typeName,
		}
	}
}

export async function deserializeSchema<TSchema extends Schema>(
	schema: TSchema,
	value: SchemaType<TSchema>
): Promise<SchemaType<TSchema>> {
	if (schema.type === Object && "properties" in schema && isObject(value)) {
		const objValue: Record<string, any> = value
		const copyValue: Record<string, any> = {}

		await Promise.all(
			Object.keys(objValue).map(async (key) => {
				const propSchema = schema.properties[key]
				if (!propSchema) {
					console.error("Unable to find type for", key, value)
					return
				}
				copyValue[key] = await deserializeSchema(propSchema, objValue[key])
			})
		)
		return copyValue as SchemaType<TSchema>
	} else if (schema.type === Array && "items" in schema && Array.isArray(value)) {
		const arrValue: Array<any> = value
		return (await Promise.all(arrValue.map((i) => deserializeSchema(schema.items, i)))) as SchemaType<TSchema>
	} else if (isResourceConstructor(schema.type) && isString(value)) {
		console.log("Deserializing Resource", value, schema.type.storage.getById(value)?.config?.name)
		return schema.type.storage.getById(value)
	} else {
		const valueType = getTypeByConstructor(schema.type)
		return valueType?.deserialize ? ((await valueType.deserialize(value, schema)) as SchemaType<TSchema>) : value
	}
}

export function serializeSchema<TSchema extends Schema>(schema: TSchema, value: ResolvedSchemaType<TSchema>): any {
	if (schema.type === Object && "properties" in schema && isObject(value)) {
		const objValue: Record<string, any> = value
		const copyValue: Record<string, any> = {}
		for (const key of Object.keys(objValue)) {
			const propSchema = schema.properties[key]
			if (!propSchema) {
				console.error("Unable to find type for", key, value)
				continue
			}
			copyValue[key] = serializeSchema(propSchema, objValue[key])
		}
		return copyValue as SchemaType<TSchema>
	} else if (schema.type === Array && "items" in schema && Array.isArray(value)) {
		const arrValue: Array<any> = value
		return arrValue.map((i) => serializeSchema(schema.items, i)) as SchemaType<TSchema>
	} else if (isResourceConstructor(schema.type)) {
		return (value as ResourceBase)?.id
	} else {
		const valueType = getTypeByConstructor(schema.type)
		return valueType?.serialize ? valueType.serialize(value, schema) : value
	}
}
