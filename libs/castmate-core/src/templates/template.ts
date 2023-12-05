import { isResourceConstructor } from "../resources/resource"
import { isArray, isBoolean, isNumber, isObject, isString } from "../util/type-helpers"
import {
	Color,
	ResolvedSchemaType,
	Schema,
	SchemaColor,
	SchemaNumber,
	SchemaString,
	SchemaType,
	getTemplateRegionString,
	getTypeByConstructor,
	getTypeByName,
	parseTemplateString,
	trimTemplateJS,
} from "castmate-schema"

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
				} catch (err) {
					console.error("Error evaluating Template", err)
				}

				result += templateResult?.toString() ?? ""
			}
		}
	}

	return result
}

export async function templateNumber(value: string | number, context: object) {
	if (isString(value)) {
		return Number(await evaluateTemplate(value, context))
	}
	return value
}

export type SchemaTemplater<T = any> = (value: T | string, context: object, schema: any) => Promise<T>

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

registerSchemaTemplate("String", async (value: string, context: object, schema: SchemaString) => {
	return await template(value, context)
})

registerSchemaTemplate("Number", async (value: number | string, context: object, schema: SchemaNumber) => {
	if (isNumber(value)) return value
	return Number(await template(value, context))
})

registerSchemaTemplate("Boolean", async (value: boolean | string, context: object, schema: SchemaNumber) => {
	if (isBoolean(value)) return value
	const strValue = await template(value, context)
	return strValue !== "false"
})

registerSchemaTemplate("Color", async (value: Color | string, context: object, schema: SchemaColor) => {
	return await template(value, context)
})
