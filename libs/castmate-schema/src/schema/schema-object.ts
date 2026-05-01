import { SchemaObj } from "../schema"
import { S, SchemaBaseOptions, SchemaBase, isSchemaType, Schema, defineSchemaType } from "./schema-base"
import { SchemaData } from "./schema-data"
import { SchemaType, ExpressedSchemaType } from "./schema-typing"

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

type ExpressedSchemaPropertiesModified<Properties extends TSchemaProperties> = {
	[Property in SchemaRequiredKeys<Properties>]: ExpressedSchemaType<Properties[Property]>
} & {
	[Property in SchemaOptionalKeys<Properties>]?: ExpressedSchemaType<Properties[Property]>
}

type ExpressedSchemaPropertiesObject<
	Properties extends TSchemaProperties,
	PropsModified extends Record<string, unknown> = ExpressedSchemaPropertiesModified<Properties>,
	Result extends Record<string, unknown> = { [Key in keyof PropsModified]: PropsModified[Key] }
> = Result

export type ExpressedSchemaObjectType<TObject extends SchemaObject> = ExpressedSchemaPropertiesObject<
	TObject["properties"]
>

type SchemaPropertiesModified<Properties extends TSchemaProperties> = {
	[Property in SchemaRequiredKeys<Properties>]: SchemaType<Properties[Property]>
} & {
	[Property in SchemaOptionalKeys<Properties>]?: SchemaType<Properties[Property]>
}

type SchemaPropertiesObject<
	Properties extends TSchemaProperties,
	PropsModified extends Record<string, unknown> = SchemaPropertiesModified<Properties>,
	Result extends Record<string, unknown> = { [Key in keyof PropsModified]: PropsModified[Key] }
> = Result

export type SchemaObjectType<TObject extends SchemaObject> = SchemaPropertiesObject<TObject["properties"]>

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

	interface SchemaTypeMap {
		Object: SchemaMapping<SchemaObject, object>
	}
}

defineSchemaType<SchemaObject>({
	type: "Object",
	name: "Object",
	traits: {},
	color: "#000000",
	icon: "mdi mdi-code",
	async constructDefault(schema) {
		const result: Record<string, any> = {}

		const promises = new Array<Promise<any>>()

		for (const key in schema.properties) {
			const prop = schema.properties[key]

			const isOptional = "optional" in prop ? prop.optional != false : false
			const hasDefault = "default" in prop ? prop.default != null : false

			if (!isOptional || hasDefault) {
				promises.push(SchemaData.constructDefault(prop).then((v) => (result[key] = v)))
			}
		}

		await Promise.all(promises)

		return result as SchemaType<typeof schema>
	},
})

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
