import { isArray } from "lodash"
import _cloneDeep from "lodash/cloneDeep"

export function changeObjectKey(object, oldKey, newKey) {
	const keyMap = { [oldKey]: newKey }
	const keyValues = Object.keys(object).map((key) => {
		const newKey = key in keyMap ? keyMap[key] : key
		return { [newKey]: object[key] }
	})

	return Object.assign({}, ...keyValues)
}

export function constructDefaultSchema(schema) {
	if (!schema) {
		return null
	} else if (schema.type == "Object") {
		const result = {}
		for (let prop in schema.properties) {
			const value = constructDefaultSchema(schema.properties[prop])
			if (value !== null) {
				result[prop] = value
			}
		}
		return result
	} else if (schema.default) {
		return _cloneDeep(schema.default)
	} else {
		return null
	}
}

function filterSchemaInternal(object, schema, filterStr) {
	if (object == undefined || object == null || schema == undefined) {
		return undefined
	}
	if (schema.type == "Object") {
		let found = false
		for (let key in schema.properties) {
			const result = filterSchemaInternal(
				object[key],
				schema.properties[key],
				filterStr
			)
			if (result !== undefined) {
				found = true
			}
			if (result) {
				return true
			}
		}
		return found ? false : undefined
	} else {
		if (schema.filter == true) {
			const testStr = String(object).toLowerCase()
			return testStr.includes(filterStr)
		}
	}
	return undefined
}

export function filterSchema(object, schema, filterStr, fallbackStr) {
	if (filterStr == null || filterStr == undefined || filterStr == "")
		return true

	const result = filterSchemaInternal(object, schema, filterStr.toLowerCase())
	if (result != undefined) {
		return result
	}
	return fallbackStr.toLowerCase().includes(filterStr.toLowerCase())
}

function hashCode(s) {
	return s.split("").reduce(function (a, b) {
		a = (a << 5) - a + b.charCodeAt(0)
		return a & a
	}, 0)
}

export function jsonHash(obj) {
	return hashCode(JSON.stringify(obj))
}

function isRecursivelyPasted(schema) {
	return schema?.type == "Object" || schema?.type == "Array"
}

export function pasteWithSchema(object, data, schema) {
	if (schema.type == "Object") {
		for (let key in schema?.properties ?? {}) {
			if (key in data) {
				const subschema = schema.properties[key]
				if (isRecursivelyPasted(subschema)) {
					pasteWithSchema(object[key], data[key], subschema)
				} else {
					//Here's where my type validation would go, IF I HAD SOME
					object[key] = data[key]
				}
			} else {
				delete object[key]
			}
		}
		return object
	} else if (schema.type == "Array") {
		const newArray = []
		const itemSchema = schema.items
		if (isArray(data)) {
			if (isRecursivelyPasted(itemSchema)) {
				for (let item of data) {
					newArray.push(pasteWithSchema({}, item, itemSchema))
				}
			} else {
				for (let item of data) {
					//Here's where my type validation would go, IF I HAD SOME
					newArray.push(item)
				}
			}
		}
		return newArray
	}
}
