import { isResourceConstructor } from "../resources/resource"
import { isArray, isObject, isString } from "../util/type-helpers"
import { ResolvedSchemaType, Schema, SchemaType, getTypeByConstructor, getTypeByName } from "castmate-schema"

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

export async function evaluateTemplate(template: string, data: object) {
	let contextObjs = { ...data }

	let func = new AsyncFunction(...Object.keys(contextObjs), `return (${template})`)

	try {
		return await func(...Object.values(contextObjs))
	} catch (err) {
		return null
	}
}

interface ParseContext {
	i: number
}

//Advances the parse context over top of a string in the JS
function skipString(templateStr: string, parseContext: ParseContext) {
	if (
		!(
			templateStr[parseContext.i] == "'" ||
			templateStr[parseContext.i] == '"' ||
			templateStr[parseContext.i] == "`"
		)
	) {
		return false
	}

	//Sample what type of string character it is ',", or `
	const stringCloser = templateStr[parseContext.i]
	let escaped = false
	for (; parseContext.i < templateStr.length; ++parseContext.i) {
		const char = templateStr[parseContext.i]
		if (!escaped && char == "\\") {
			//We've found an escape character, don't count the following character as a string closer
			escaped = true
			continue
		} else if (!escaped && char == stringCloser) {
			//This string is finally closed
			return true
		}
		escaped = false
	}

	//Returns with the parse context on the string closing character
	return true
}

//Finds the end }}
export function findTemplateClosing(templateStr: string, searchStart: number) {
	let openCurlyCounter = 0
	const parseContext = { i: searchStart + 2 } //Skip the initial {{
	for (; parseContext.i < templateStr.length; ++parseContext.i) {
		//If skipString returns true parseContext is still on the closing string character, continue to move forward
		if (skipString(templateStr, parseContext)) continue

		const char = templateStr[parseContext.i]
		if (char == "{") {
			++openCurlyCounter
		} else if (char == "}") {
			--openCurlyCounter

			//Count to -2 since we want }}
			if (openCurlyCounter == -2) {
				break
			}
		}
	}

	return parseContext.i
}

export function getNextTemplate(templateStr: string, searchStart: number) {
	//Look for the next {{
	const index = templateStr.indexOf("{{", searchStart)

	if (index == -1) {
		//No more templates, return the rest of the string as filler
		return { filler: templateStr.substring(searchStart) }
	}

	//Get the string inbetween the last template and the start of this one.
	const filler = templateStr.substring(searchStart, index - searchStart)

	//Find the end of the template
	const endIndex = findTemplateClosing(templateStr, index)

	//Extract the template's JS code
	const template = templateStr.substring(index + 2, endIndex - 2 - (index + 2) + 1)

	return { filler, template, endIndex }
}

export async function template(templateStr: string, data: object) {
	//Extract stuff inbetween {{ }}
	let resultStr = ""
	if (!templateStr) return resultStr

	let searchStart = 0

	while (true) {
		const { filler, template, endIndex } = getNextTemplate(templateStr, searchStart)

		resultStr += filler

		//If there's no template in getNextTemplate() then we've hit the end of the string
		if (!template) {
			break
		}

		//Evaluate the template string as JS
		let templateResult = undefined
		try {
			templateResult = await evaluateTemplate(template, data)
		} catch {}

		//Append it to the string if it's not nullish
		resultStr += templateResult?.toString() ?? ""

		//move the search
		searchStart = endIndex + 1
	}

	return resultStr
}

export async function templateNumber(value: string | number, context: object) {
	if (isString(value)) {
		return Number(await evaluateTemplate(value, context))
	}
	return value
}

export type SchemaTemplater<T = any> = (value: T, context: object, schema: any) => Promise<T>

declare module "castmate-schema" {
	interface DataTypeMetaData<T = any> {
		template?: SchemaTemplater<T>
	}
}

export async function templateSchema<TSchema extends Schema>(
	obj: SchemaType<TSchema>,
	schema: TSchema,
	context: object
): Promise<ResolvedSchemaType<TSchema>> {
	if (schema.type === Object && "properties" in schema && isObject(obj)) {
		const result: Record<string, any> = {}

		await Promise.all(
			Object.keys(schema.properties).map(async (key) => {
				//@ts-ignore Type system too stupid again.
				result[key] = templateSchema(obj[key], schema.properties[key], context)
			})
		)

		return result as ResolvedSchemaType<TSchema>
	} else if (schema.type === Array && "items" in schema && isArray(obj)) {
		return (await Promise.all(
			obj.map((item) => templateSchema(item, schema.items, context))
		)) as ResolvedSchemaType<TSchema>
	} else if (isResourceConstructor(schema.type)) {
		//How to template resources??
		return obj
	} else {
		//Some type crap means this has to be out here instead of inside the if
		const type = getTypeByConstructor<any>(schema.type)
		if ("template" in schema && schema.template && isString(obj)) {
			if (!type) throw new Error("Unknown Schema Type!")
			if (!type.template) throw new Error("Trying to template a type that doesn't have a templater registered")
			return await type.template(obj, context, schema)
		} else {
			return obj
		}
	}
}

export function registerSchemaTemplate<T>(name: string, templateFunc: SchemaTemplater<T>) {
	const schemaType = getTypeByName(name)
	if (!schemaType) throw new Error(`Missing Schema Type ${name}`)

	schemaType.template = templateFunc
}
