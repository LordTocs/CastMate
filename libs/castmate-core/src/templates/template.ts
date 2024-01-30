import { isResourceConstructor } from "../resources/resource"
import { isArray, isBoolean, isNumber, isObject, isString } from "../util/type-helpers"
import {
	Color,
	DataConstructorOrFactory,
	ResolvedSchemaType,
	ResolvedTypeByConstructor,
	Schema,
	SchemaColor,
	SchemaNumber,
	SchemaString,
	SchemaType,
	SchemaTypeByConstructor,
	TemplateTypeByConstructor,
	getTemplateRegionString,
	getTypeByConstructor,
	getTypeByName,
	parseTemplateString,
	trimTemplateJS,
} from "castmate-schema"
import escapeRegExp from "lodash/escapeRegExp"

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

export async function evaluateTemplate(template: string, data: object) {
	let contextObjs = { ...data }

	try {
		let func = new AsyncFunction(...Object.keys(contextObjs), `return (${template})`)
		return await func(...Object.values(contextObjs))
	} catch (err) {
		console.error("Error Evaluating Template", err)
		return undefined
	}
}

export async function template(templateStr: string, data: object) {
	const templateData = parseTemplateString(templateStr)
	let result = ""

	for (const region of templateData.regions) {
		if (region.type == "string") {
			result += getTemplateRegionString(templateData, region)
		} else {
			const js = getTemplateRegionString(templateData, region)
			const trimmed = trimTemplateJS(js)
			if (trimmed) {
				let templateResult = undefined
				try {
					templateResult = await evaluateTemplate(trimmed, data)
					result += String(templateResult)
				} catch (err) {
					console.error("Error evaluating Template", err)
				}
			}
		}
	}

	return result
}

export function isProbablyFromTemplate(value: string, template: string) {
	const templateData = parseTemplateString(template)

	let exp = "^"

	for (const region of templateData.regions) {
		if (region.type == "string") {
			exp += escapeRegExp(getTemplateRegionString(templateData, region))
		} else if (region.type == "template") {
			exp += ".*"
		}
	}

	exp += "$"

	const regexp = new RegExp(exp)

	return value.match(regexp) != null
}

export async function templateNumber(value: string | number, context: object) {
	if (isNumber(value)) return value
	return Number(await template(value, context))
}

export type SchemaTemplater<T extends DataConstructorOrFactory> = (
	value: TemplateTypeByConstructor<T>,
	context: object,
	schema: SchemaTypeByConstructor<T>
) => Promise<ResolvedTypeByConstructor<T> | undefined>

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
				result[key] = await templateSchema(obj[key], schema.properties[key], context)
			})
		)

		return result as ResolvedSchemaType<TSchema>
	} else if (schema.type === Array && "items" in schema && isArray(obj)) {
		return (await Promise.all(
			obj.map((item: any) => templateSchema(item, schema.items, context))
		)) as ResolvedSchemaType<TSchema>
	} else if (isResourceConstructor(schema.type)) {
		//How to template resources??
		return obj
	} else {
		//Some type crap means this has to be out here instead of inside the if
		const type = getTypeByConstructor<any>(schema.type)
		if ("template" in schema && schema.template && obj != null) {
			if (!type) throw new Error("Unknown Schema Type!")
			if (!type.template) throw new Error("Trying to template a type that doesn't have a templater registered")
			return await type.template(obj, context, schema)
		} else {
			return obj
		}
	}
}

export function registerSchemaTemplate<DataCon extends DataConstructorOrFactory>(
	constructor: DataCon,
	templateFunc: SchemaTemplater<DataCon>
) {
	const schemaType = getTypeByConstructor(constructor)
	if (!schemaType) throw new Error(`Missing Schema Type ${name}`)

	schemaType.template = templateFunc
}

registerSchemaTemplate(String, async (value, context, schema) => {
	let str = await template(value, context)

	if (schema.maxLength != null) {
		str = str.substring(0, schema.maxLength)
	}

	return str
})

registerSchemaTemplate(Number, async (value, context, schema) => {
	if (isNumber(value)) return value
	let num = Number(await template(value, context))

	if (schema.min != null) {
		num = Math.max(schema.min, num)
	}
	if (schema.max != null) {
		num = Math.min(schema.max, num)
	}

	return num
})

registerSchemaTemplate(Boolean, async (value, context, schema) => {
	if (isBoolean(value)) return value
	const strValue = await template(value, context)
	return strValue !== "false"
})

registerSchemaTemplate(Color, async (value, context, schema) => {
	return await template(value, context)
})
