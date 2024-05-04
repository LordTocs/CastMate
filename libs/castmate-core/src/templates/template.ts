import { globalLogger } from "../logging/logging"
import { isResourceConstructor } from "../resources/resource"
import { isArray, isBoolean, isNumber, isObject, isString } from "../util/type-helpers"
import {
	Color,
	DataConstructorOrFactory,
	Directory,
	Duration,
	DynamicType,
	FilePath,
	RemoteSchemaType,
	RemoteTemplateIntermediateSubstring,
	RemoteTemplateString,
	RemoteTemplateTypeByConstructor,
	ResolvedSchemaType,
	ResolvedTypeByConstructor,
	Schema,
	SchemaDynamicType,
	SchemaType,
	SchemaTypeByConstructor,
	TemplateTypeByConstructor,
	getTemplateRegionString,
	getTypeByConstructor,
	isTimer,
	isTimerStarted,
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
		globalLogger.error("Error Evaluating Template", err)
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
	schema: SchemaTypeByConstructor<T>,
	rootValue: any
) => Promise<ResolvedTypeByConstructor<T> | undefined>

export type SchemaRemoteTemplater<T extends DataConstructorOrFactory> = (
	value: TemplateTypeByConstructor<T>,
	context: object,
	schema: SchemaTypeByConstructor<T>
) => Promise<RemoteTemplateTypeByConstructor<T> | undefined>

declare module "castmate-schema" {
	interface DataTypeMetaData<T = any> {
		template?: SchemaTemplater<T>
		remoteTemplate?: SchemaRemoteTemplater<T>
	}
}

export async function templateSchema<TSchema extends Schema>(
	obj: SchemaType<TSchema>,
	schema: TSchema,
	context: object,
	rootValue?: any
): Promise<ResolvedSchemaType<TSchema>> {
	if (rootValue == undefined) rootValue = obj

	if (schema.type === Object && "properties" in schema && isObject(obj)) {
		const result: Record<string, any> = {}

		await Promise.all(
			Object.keys(schema.properties).map(async (key) => {
				//@ts-ignore Type system too stupid again.
				result[key] = await templateSchema(obj[key], schema.properties[key], context, rootValue)
			})
		)

		return result as ResolvedSchemaType<TSchema>
	} else if (schema.type === Array && "items" in schema && isArray(obj)) {
		return (await Promise.all(
			obj.map((item: any) => templateSchema(item, schema.items, context, rootValue))
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
			return await type.template(obj, context, schema, rootValue)
		} else {
			return obj
		}
	}
}

export async function remoteTemplateSchema<TSchema extends Schema>(
	obj: SchemaType<TSchema>,
	schema: TSchema,
	context: object,
	rootValue?: any
): Promise<RemoteSchemaType<TSchema>> {
	if (rootValue == undefined) rootValue = obj

	if (schema.type === Object && "properties" in schema && isObject(obj)) {
		const result: Record<string, any> = {}

		await Promise.all(
			Object.keys(schema.properties).map(async (key) => {
				//@ts-ignore Type system too stupid again.
				result[key] = await remoteTemplateSchema(obj[key], schema.properties[key], context, rootValue)
			})
		)

		return result as RemoteSchemaType<TSchema>
	} else if (schema.type === Array && "items" in schema && isArray(obj)) {
		return (await Promise.all(
			obj.map((item: any) => remoteTemplateSchema(item, schema.items, context, rootValue))
		)) as RemoteSchemaType<TSchema>
	} else if (isResourceConstructor(schema.type)) {
		//How to template resources??
		return obj
	} else {
		//Some type crap means this has to be out here instead of inside the if
		const type = getTypeByConstructor<any>(schema.type)
		if ("template" in schema && schema.template && obj != null) {
			if (!type) throw new Error("Unknown Schema Type!")
			if (type.remoteTemplate) {
				return (await type.remoteTemplate(obj, context, schema)) as RemoteSchemaType<TSchema>
			} else if (type.template) {
				return await type.template(obj, context, schema, rootValue)
			} else {
				throw new Error("Trying to remote template a type that doesn't have a templater registered")
			}
		} else {
			return obj
		}
	}
}

export async function remoteTemplate(templateStr: string, data: object): Promise<RemoteTemplateString> {
	const templateData = parseTemplateString(templateStr)

	let result: RemoteTemplateString = []

	for (const region of templateData.regions) {
		const last = result[result.length - 1]

		if (region.type == "string") {
			const str = getTemplateRegionString(templateData, region)
			if (last && typeof last == "string") {
				result[result.length - 1] = last + str
			} else {
				result.push(str)
			}
		} else {
			const js = getTemplateRegionString(templateData, region)
			const trimmed = trimTemplateJS(js)
			if (trimmed) {
				let templateResult = undefined
				try {
					templateResult = await evaluateTemplate(trimmed, data)
					const remoteTemplateValue = await getRemoteTemplateIntermediate(templateResult)
					if (remoteTemplateValue != null) {
						result.push(remoteTemplateValue)
					} else {
						const str = String(templateResult)
						if (last && typeof last == "string") {
							result[result.length - 1] = last + str
						} else {
							result.push(str)
						}
					}
				} catch (err) {
					console.error("Error evaluating Template", err)
				}
			}
		}
	}

	return result
}

export function registerSchemaTemplate<DataCon extends DataConstructorOrFactory>(
	constructor: DataCon,
	templateFunc: SchemaTemplater<DataCon>
) {
	const schemaType = getTypeByConstructor(constructor)
	if (!schemaType) throw new Error(`Missing Schema Type ${name}`)

	schemaType.template = templateFunc
}

export function registerSchemaRemoteTemplate<DataCon extends DataConstructorOrFactory>(
	constructor: DataCon,
	templateFunc: SchemaRemoteTemplater<DataCon>
) {
	const schemaType = getTypeByConstructor(constructor)
	if (!schemaType) throw new Error(`Missing Schema Type ${name}`)

	schemaType.remoteTemplate = templateFunc
}

registerSchemaTemplate(String, async (value, context, schema) => {
	let str = await template(value, context)

	if (schema.maxLength != null) {
		str = str.substring(0, schema.maxLength)
	}

	return str
})

registerSchemaRemoteTemplate(String, async (value, context, schema) => {
	return remoteTemplate(value, context)
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

registerSchemaTemplate(Duration, async (value, context, schema) => {
	if (isNumber(value)) return value
	let num = Number(await template(value, context))
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

registerSchemaTemplate(FilePath, async (value, context, schema) => {
	let str = await template(value, context)
	return str
})

registerSchemaTemplate(Directory, async (value, context, schema) => {
	let str = await template(value, context)
	return str
})

registerSchemaTemplate(DynamicType, async (value, context, schema: SchemaDynamicType, rootValue) => {
	const dynamicSchema = await schema.dynamicType(rootValue)

	globalLogger.log("Trying to template", value, rootValue, schema)

	return await templateSchema(value, dynamicSchema, context)
})

////
// Remote Data Serialization
export type RemoteDataSerializer = (data: any) => Promise<RemoteTemplateIntermediateSubstring | undefined>

const remoteDataSerializers: RemoteDataSerializer[] = []

export function registerRemoteDataSerializer(serializer: RemoteDataSerializer) {
	remoteDataSerializers.push(serializer)
}

function successfulSerializer(
	result: PromiseSettledResult<RemoteTemplateIntermediateSubstring | undefined>
): result is PromiseFulfilledResult<RemoteTemplateIntermediateSubstring> {
	return result.status == "fulfilled" && result.value != null
}

async function getRemoteTemplateIntermediate(data: any) {
	const serializers = await Promise.allSettled(remoteDataSerializers.map((s) => s(data)))

	const successfulSerializers = serializers.filter(successfulSerializer)

	if (successfulSerializers.length == 0) {
		return undefined
	}

	return successfulSerializers[0].value
}

registerRemoteDataSerializer(async (data) => {
	if (isTimer(data)) {
		if (isTimerStarted(data)) {
			return {
				type: "Timer",
				data: {
					endTime: data.endTime,
				},
			}
		} else {
			return {
				type: "Timer",
				data: {
					remainingTime: data.remainingTime,
				},
			}
		}
	}
	return undefined
})
