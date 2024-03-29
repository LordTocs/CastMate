import _cloneDeep from "lodash/cloneDeep"

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

export async function evalTemplate(template, data) {
	let contextObjs = { ...data }

	let func = new AsyncFunction(
		...Object.keys(contextObjs),
		`return (${template})`
	)

	try {
		return func(...Object.values(contextObjs))
	} catch (err) {
		return null
	}
}

//TODO: Improve backtick string support
function skipString(templateStr, parseContext) {
	if (
		!(
			templateStr[parseContext.i] == "'" ||
			templateStr[parseContext.i] == '"' ||
			templateStr[parseContext.i] == "`"
		)
	) {
		return false
	}

	let stringCloser = templateStr[parseContext.i]
	let escaped = false
	for (; parseContext.i < templateStr.length; ++parseContext.i) {
		let char = templateStr[parseContext.i]
		if (!escaped && char == "\\") {
			escaped = true
			continue
		} else if (!escaped && char == stringCloser) {
			//This string is finally closed
			return true
		}
		escaped = false
	}

	return true
}

export function findTemplateClosing(templateStr, searchStart) {
	let openCurlyCounter = 0
	let parseContext = { i: searchStart + 2 } //Skip the initial {{
	for (; parseContext.i < templateStr.length; ++parseContext.i) {
		if (skipString(templateStr, parseContext)) continue

		let char = templateStr[parseContext.i]

		if (char == "{") {
			++openCurlyCounter
		} else if (char == "}") {
			--openCurlyCounter
			if (openCurlyCounter == -2) {
				break
			}
		}
	}

	return parseContext.i
}

export function getNextTemplate(templateStr, searchStart) {
	let index = templateStr.indexOf("{{", searchStart)

	if (index == -1) {
		return { filler: templateStr.substr(searchStart) }
	}

	let filler = templateStr.substr(searchStart, index - searchStart)

	const endIndex = findTemplateClosing(templateStr, index)

	const template = templateStr.substr(
		index + 2,
		endIndex - 2 - (index + 2) + 1
	)

	return { filler, template, endIndex }
}

export async function template(templateStr, data, escapeFunction) {
	//Extract stuff inbetween {{ }}
	let resultStr = ""
	if (!templateStr) return resultStr

	let searchStart = 0

	while (true) {
		const { filler, template, endIndex } = getNextTemplate(
			templateStr,
			searchStart
		)

		// let index = findNextTemplateStart(templateStr, searchStart)
		// if (index == -1) {
		// 	resultStr += templateStr.substr(searchStart)
		// 	break
		// }

		// resultStr += templateStr.substr(searchStart, index - searchStart)

		// let openCurlyCounter = 0
		// let parseContext = { i: index + 2 }
		// for (; parseContext.i < templateStr.length; ++parseContext.i) {
		// 	if (skipString(templateStr, parseContext)) continue

		// 	let char = templateStr[parseContext.i]

		// 	if (char == "{") {
		// 		++openCurlyCounter
		// 	} else if (char == "}") {
		// 		--openCurlyCounter
		// 		if (openCurlyCounter == -2) {
		// 			break
		// 		}
		// 	}
		// }

		// let template = templateStr.substr(
		// 	index + 2,
		// 	parseContext.i - 2 - (index + 2) + 1
		// )
		resultStr += filler

		if (!template) {
			break
		}

		let templateResult = undefined
		try {
			templateResult = await evalTemplate(template, data)
		} catch {}

		resultStr += templateResult?.toString() ?? ""

		searchStart = endIndex + 1
	}

	return resultStr
}

export async function templateNumber(value, context) {
	if (typeof value === "string" || value instanceof String) {
		return Number(await evalTemplate(value, context))
	}
	return value
}

export async function templateSchema(obj, schema, context) {
	if (!schema) return obj

	if (schema.type == Object || schema.type == "Object") {
		const result = {}
		const promises = []

		for (let key in schema.properties) {
			promises.push(
				(async () => {
					if (!(key in obj)) return

					const subObj = obj[key]
					const subSchema = schema.properties[key]

					result[key] = await templateSchema(
						subObj,
						subSchema,
						context
					)
				})()
			)
		}

		await Promise.all(promises)

		return result
	} else if (schema.type == "Array" || schema.type == Array) {
		const promises = []

		for (let arrItem of obj) {
			promises.push(templateSchema(arrItem, schema.items, schema))
		}

		return await Promise.all(promises)
	} else if (schema.template) {
		if (schema.type == "String" || schema.type == String) {
			return await template(obj, context)
		} else if (schema.type == "Number" || schema.type == Number) {
			return await templateNumber(obj, context)
		}
	}

	return obj
}
