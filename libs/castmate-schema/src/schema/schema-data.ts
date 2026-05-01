import { getSchemaMetaData, Schema, SchemaTypeMap } from "./schema-base"
import { SchemaType } from "./schema-typing"
export namespace SchemaData {
	export async function constructDefault<TSchema extends Schema>(schema: TSchema): Promise<SchemaType<TSchema>> {
		// const hasDefaultValue = "default" in schema ? schema.default != null : false
		// const isOptional = "optional" in schema ? schema.optional != false : false

		// if (isOptional && !hasDefaultValue) return undefined

		const metaData = getSchemaMetaData(schema.type as keyof SchemaTypeMap)

		const construct = metaData?.constructDefault

		if (!construct) {
			throw new Error("Missing Construct Default")
		}

		//@ts-expect-error
		return await construct(schema)
	}
}
