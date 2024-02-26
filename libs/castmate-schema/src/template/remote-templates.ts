import {
	DataConstructorOrFactory,
	RemoteSchemaType,
	RemoteTemplateTypeByConstructor,
	ResolvedSchemaType,
	ResolvedTypeByConstructor,
	Schema,
	getTypeByConstructor,
} from "../schema"

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
let remoteDataDeserializers: Record<string, RemoteDataDeserializer> = {}
export function resolveRemoteTemplate(remoteTemplate: RemoteTemplateString): string {
	let result = ""

	for (const segment of remoteTemplate) {
		if (isString(segment)) {
			result += segment
		} else {
			const deserializer = remoteDataDeserializers?.[segment.type]
			if (deserializer) {
				result += deserializer(segment)
			}
		}
	}

	return result
}

export type RemoteDataDeserializer = (data: RemoteTemplateIntermediateSubstring) => string

export function registerRemoteDataDeserializer(type: string, deserializer: RemoteDataDeserializer) {
	remoteDataDeserializers[type] = deserializer
}
