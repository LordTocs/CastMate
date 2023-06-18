import { ipcMain } from "./electronBridge.js"
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
import _, { isString } from "lodash"

function cleanFuncForIPC(thisObj, propName, rootName) {
	const maybeFunc = thisObj[propName]
	if (maybeFunc instanceof Function || maybeFunc instanceof AsyncFunction) {
		thisObj[propName] = rootName + "_" + propName
	}
}

function isStringType(type) {
	return type == "String" || type == String
}

function isObjectType(type) {
	return type == "Object" || type == Object
}

function isArrayType(type) {
	return type == "Array" || type == Array
}

isString

export function cleanSchemaForIPC(rootName, schema) {
	let result = { ...schema }

	if (isObjectType(schema.type)) {
		result.type = "Object"
		if (schema.properties) {
			result.properties = {}
			for (let prop in schema.properties) {
				result.properties[prop] = cleanSchemaForIPC(
					rootName + "_" + prop,
					schema.properties[prop]
				)
			}
		}
	} else if (isArrayType(schema.type)) {
		result.type = "Array"
		if (schema.items?.type) {
			result.items = cleanSchemaForIPC(rootName + "_items", schema.items)
		}
	} else {
		if (schema.type && !isString(schema.type)) {
			if (schema.type.resourceContainer) {
				result.type = "Resource"
				result.resourceType = schema.type.resourceContainer?.spec?.type
			} else {
				result.type = result.type.name
			}
		}

		cleanFuncForIPC(result, "enum", rootName)
		cleanFuncForIPC(result, "enumQuery", rootName)
		cleanFuncForIPC(result, "dynamicType", rootName)
	}

	return result
}

export function createIPCFunction(thisObj, name, func) {
	if (!func) {
		return
	} else if (func instanceof AsyncFunction) {
		const enumFunc = func.bind(thisObj)
		ipcMain.handle(name, async (event, ...args) => {
			return await enumFunc(...args)
		})
	} else if (func instanceof Function) {
		const enumFunc = func.bind(thisObj)
		ipcMain.handle(name, (event, ...args) => {
			return enumFunc(...args)
		})
	}
}

export function makeIPCEnumFunctions(thisObj, rootName, schema) {
	if (schema.type == Object) {
		if (schema.properties) {
			for (let prop in schema.properties) {
				makeIPCEnumFunctions(
					thisObj,
					rootName + "_" + prop,
					schema.properties[prop]
				)
			}
		}
	} else {
		createIPCFunction(thisObj, rootName + "_enum", schema.enum)
		createIPCFunction(thisObj, rootName + "_enumQuery", schema.enumQuery)
		createIPCFunction(
			thisObj,
			rootName + "_dynamicType",
			schema.dynamicType
		)
	}
}

export function constructDefaultSchema(schema) {
	if (schema.type == "Object") {
		const result = {}
		for (let prop in schema.properties) {
			const value = constructDefaultSchema(schema.properties[prop])
			if (value !== null) {
				result[prop] = value
			}
		}
		return result
	} else if (schema.default) {
		return _.cloneDeep(schema.default)
	} else {
		return null
	}
}
