import {
	DataConstructorOrFactory,
	RemoteSchemaType,
	RemoteTemplateTypeByConstructor,
	ResolvedSchemaType,
	ResolvedTypeByConstructor,
	Schema,
	getTypeByConstructor,
} from "../schema"

export interface TemplateStringRegion {
	startIndex: number
	endIndex: number
	type: "string" | "template"
}

export interface TemplateString {
	fullString: string
	regions: TemplateStringRegion[]
}

export function isTemplateCode(str: TemplateString, position: number) {
	for (const region of str.regions) {
		if (region.startIndex <= position && region.endIndex > position) {
			return region.type == "template"
		}
	}
	return false
}

export function getTemplateRegionString(str: TemplateString, region: TemplateStringRegion) {
	return str.fullString.substring(region.startIndex, region.endIndex)
}

export function trimTemplateJS(jsStr: string) {
	if (!jsStr.startsWith("{{")) return undefined
	if (!jsStr.endsWith("}}")) return undefined
	return jsStr.substring(2, jsStr.length - 2)
}

export function regionLength(region: TemplateStringRegion) {
	return region.endIndex - region.startIndex
}

interface ParseContext {
	i: number
}

function parseStringRegion(str: string, context: ParseContext) {
	const result: TemplateStringRegion = {
		startIndex: context.i,
		endIndex: context.i,
		type: "string",
	}

	const index = str.indexOf("{{", context.i)

	if (index == -1) {
		result.endIndex = str.length
		context.i = str.length
	} else {
		result.endIndex = index
		context.i = index
	}

	return result
}

function skipJSString(str: string, context: ParseContext) {
	if (!(str[context.i] == "'" || str[context.i] == '"' || str[context.i] == "`")) {
		return false
	}

	const stringCloser = str[context.i]
	const isInterpolated = stringCloser == "`"
	let escaped = false
	let dollarsign = false
	for (; context.i < str.length; ++context.i) {
		const char = str[context.i]
		if (!escaped && char == "\\") {
			//We've found an escape character, don't count the following character as a string closer
			escaped = true
			continue
		}
		if (escaped) {
			escaped = false
			continue
		}

		if (isInterpolated) {
			if (char == "$") {
				dollarsign = true
				continue
			}
			if (dollarsign) {
				if (char == "{") {
					context.i += 1
					skipJS(str, context, 1)
					context.i-- //Back up because when we continue we'll move forward
					dollarsign = false
					continue
				} else {
					dollarsign = false
				}
			}
		}

		if (char == stringCloser) {
			return true
		}
	}
}

function skipJS(str: string, context: ParseContext, expectedCloseCurlies: number = 2) {
	let openCurlyCounter = 0
	for (; context.i < str.length; ++context.i) {
		if (skipJSString(str, context)) continue

		const char = str[context.i]
		if (char == "{") {
			++openCurlyCounter
		} else if (char == "}") {
			--openCurlyCounter

			if (openCurlyCounter == -expectedCloseCurlies) {
				break
			}
		}
	}
	context.i++
}

function parseTemplateRegion(str: string, context: ParseContext) {
	if (str[context.i] != "{" && str[context.i + 1] != "{") return undefined
	const result: TemplateStringRegion = {
		startIndex: context.i,
		endIndex: context.i,
		type: "template",
	}
	context.i += 2
	skipJS(str, context, 2)
	result.endIndex = context.i

	return result
}

export function parseTemplateString(str: string): TemplateString {
	const result: TemplateString = {
		fullString: str,
		regions: [],
	}

	const context: ParseContext = {
		i: 0,
	}

	while (context.i < str.length) {
		const textRegion = parseStringRegion(str, context)
		if (regionLength(textRegion) > 0) {
			result.regions.push(textRegion)
		}
		const templateRegion = parseTemplateRegion(str, context)
		if (templateRegion) {
			result.regions.push(templateRegion)
		}
	}

	return result
}
//TODO: Move type helpers!
export function isSymbol(value: unknown): value is symbol {
	return typeof value === "symbol"
}

export function isString(value: unknown): value is string {
	return typeof value === "string"
}

export function isNumber(value: unknown): value is number {
	return typeof value === "number"
}

export function isBoolean(value: unknown): value is boolean {
	return typeof value === "boolean"
}

export const isArray = Array.isArray

export function isObject(value: unknown): value is object {
	return typeof value === "object"
}

export interface RemoteTemplateIntermediateSubstring {
	type: string
	data: object
}
export type RemoteTemplateString = (string | RemoteTemplateIntermediateSubstring)[]

export function registerRemoteTemplateResolver<DataCon extends DataConstructorOrFactory>(
	con: DataCon,
	resolver: (
		remoteValue: RemoteTemplateTypeByConstructor<DataCon>,
		schema: Schema
	) => ResolvedTypeByConstructor<DataCon>
) {
	const schemaType = getTypeByConstructor(con)
	if (!schemaType) throw new Error(`Missing Schema Type ${name}`)

	schemaType.remoteTemplateResolve = resolver
}

export function resolveRemoteTemplateSchema<TSchema extends Schema>(
	obj: RemoteSchemaType<TSchema>,
	schema: TSchema
): ResolvedSchemaType<TSchema> {
	if (schema.type === Object && "properties" in schema && isObject(obj)) {
		const result: Record<string, any> = {}

		for (const key of Object.keys(schema.properties)) {
			result[key] = resolveRemoteTemplateSchema(obj[key], schema.properties[key])
		}

		return result as RemoteSchemaType<TSchema>
	} else if (schema.type === Array && "items" in schema && isArray(obj)) {
		return obj.map((item: any) => resolveRemoteTemplateSchema(item, schema.items)) as RemoteSchemaType<TSchema>
	} else if (/*isResourceConstructor(schema.type)*/ false) {
		//How to template resources??
		return obj
	} else {
		//Some type crap means this has to be out here instead of inside the if
		const type = getTypeByConstructor<any>(schema.type)
		if ("template" in schema && schema.template && obj != null) {
			if (!type) throw new Error("Unknown Schema Type!")
			if (type.remoteTemplateResolve) {
				return type.remoteTemplateResolve(obj, schema)
			} else {
				return obj
			}
		} else {
			return obj
		}
	}
}

registerRemoteTemplateResolver(String, (remoteValue, schema) => {
	return resolveRemoteTemplate(remoteValue)
})

///
export function resolveRemoteTemplate(remoteTemplate: RemoteTemplateString): string {
	let result = ""

	for (const segment of remoteTemplate) {
		if (isString(segment)) {
			result += segment
		} else {
			const deserializer = remoteDataDeserializers[segment.type]
			if (deserializer) {
				result += deserializer(segment)
			}
		}
	}

	return result
}

export type RemoteDataDeserializer = (data: RemoteTemplateIntermediateSubstring) => string

const remoteDataDeserializers: Record<string, RemoteDataDeserializer> = {}
export function registerRemoteDataDeserializer(type: string, deserializer: RemoteDataDeserializer) {
	remoteDataDeserializers[type] = deserializer
}
