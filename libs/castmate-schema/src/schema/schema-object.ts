import { S, SchemaBaseOptions, SchemaBase, isSchemaType, Schema } from "./schema-base"
import { ResolvedSchemaType, UnresolvedSchemaType } from "./schema-typing"

export type TSchemaProperties = Record<string, Schema>

export interface SchemaObjectOptions<Properties extends TSchemaProperties> extends SchemaBaseOptions {}

export interface SchemaObject<Properties extends TSchemaProperties = TSchemaProperties>
	extends SchemaBase<"Object">,
		SchemaObjectOptions<Properties> {
	properties: Properties
}

type SchemaOptionalKeys<
	Properties extends TSchemaProperties,
	Result extends PropertyKey = {
		[Key in keyof Properties]: Properties[Key] extends { optional: true } ? Key : never
	}[keyof Properties]
> = Result

type SchemaRequiredKeys<Properties extends Record<string, Schema>> = keyof Omit<
	Properties,
	SchemaOptionalKeys<Properties>
>

type UnresolvedSchemaPropertiesModified<Properties extends TSchemaProperties> = {
	[Property in SchemaRequiredKeys<Properties>]: UnresolvedSchemaType<Properties[Property]>
} & {
	[Property in SchemaOptionalKeys<Properties>]?: UnresolvedSchemaType<Properties[Property]>
}

type UnresolvedSchemaPropertiesObject<
	Properties extends TSchemaProperties,
	PropsModified extends Record<string, unknown> = UnresolvedSchemaPropertiesModified<Properties>,
	Result extends Record<string, unknown> = { [Key in keyof PropsModified]: PropsModified[Key] }
> = Result

export type UnresolvedSchemaObjectType<TObject extends SchemaObject> = UnresolvedSchemaPropertiesObject<
	TObject["properties"]
>

type ResolvedSchemaPropertiesModified<Properties extends TSchemaProperties> = {
	[Property in SchemaRequiredKeys<Properties>]: ResolvedSchemaType<Properties[Property]>
} & {
	[Property in SchemaOptionalKeys<Properties>]?: ResolvedSchemaType<Properties[Property]>
}

type ResolvedSchemaPropertiesObject<
	Properties extends TSchemaProperties,
	PropsModified extends Record<string, unknown> = ResolvedSchemaPropertiesModified<Properties>,
	Result extends Record<string, unknown> = { [Key in keyof PropsModified]: PropsModified[Key] }
> = Result

export type ResolvedSchemaObjectType<TObject extends SchemaObject> = ResolvedSchemaPropertiesObject<
	TObject["properties"]
>

export function isObjectSchema(schema: unknown): schema is SchemaObject {
	if (!isSchemaType(schema, "Object")) return false
	if (!("properties" in schema)) return false
	if (typeof schema.properties != "object") return false
	return true
}

declare module "./schema-base" {
	namespace S {
		function Object<Properties extends Record<string, Schema>>(
			properties: Properties,
			options?: SchemaObjectOptions<Properties>
		): SchemaObject<Properties>
	}
}

S.Object = <Properties extends Record<string, Schema>>(
	properties: Properties,
	options?: SchemaObjectOptions<Properties>
) => {
	return {
		type: "Object",
		properties,
		...options,
	}
}
