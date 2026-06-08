import { InequalityOperator } from "../expression/nodes/comparison-expression"
import { MaybePromise } from "../util/type-helpers"
import { SchemaType, SchemaTypeByName, SchemaByName } from "./schema-typing"

export interface Schema extends SchemaBaseOptions {
	type: string
}

export interface Defaultable<T> {
	default?: T | (() => MaybePromise<T>)
}

export async function getDefault<T>(defaultable: Defaultable<T>): Promise<T | undefined> {
	if (!defaultable.default) return undefined
	if (typeof defaultable.default == "function") {
		//@ts-ignore
		return await defaultable.default()
	}
	return defaultable.default
}

export interface EnumPair<T> {
	value: T
	name: string
}

export type EnumItem<T> = T | EnumPair<T>

export interface Enumable<T> {
	enum?: Array<EnumItem<T>> | (() => Promise<Array<EnumItem<T>>>) | ((context: any) => Promise<Array<EnumItem<T>>>)
}

export interface SchemaBaseOptions {
	name?: string
	view?: boolean
}

export type SchemaInternalOptions = {
	optional?: boolean
	inExpressable?: boolean
}

export interface SchemaBase<Type extends string = string> extends SchemaInternalOptions {
	type: Type
}

type OptionalSchema<T extends SchemaBase = SchemaBase> = T & { optional: true }
type InexpressableSchema<T extends SchemaBase = SchemaBase> = T & { inExpressable: true }

export namespace S {
	export function Optional<TSchema extends SchemaBase>(schema: TSchema): OptionalSchema<TSchema> {
		return {
			...schema,
			optional: true,
		}
	}

	/**
	 * Prevent expressions from being used for this data.
	 * @param schema
	 * @returns
	 */
	export function InExpressable<TSchema extends SchemaBase>(schema: TSchema): InexpressableSchema<TSchema> {
		return {
			...schema,
			inExpressable: true,
		}
	}
}

export namespace SchemaMeta {
	export function isExpressable<TSchema extends SchemaBase>(schema: TSchema): schema is InexpressableSchema<TSchema> {
		return !schema.inExpressable
	}
}

export function isSchemaType<Type extends string>(schema: unknown, type: Type): schema is { type: Type } {
	if (!schema) return false
	if (typeof schema != "object") return false
	if (!("type" in schema)) return false
	return schema.type == type
}

export interface SchemaMapping<TSchema extends Schema = any, Type = any, ExpressedType = never> {
	schema: TSchema
	type: Type
	expressedType: ExpressedType
}

export interface SchemaTypeMap {}

export type SchemaTypeNames = keyof SchemaTypeMap
export type ValueSchema = SchemaTypeMap[SchemaTypeNames]["schema"]

export interface SchemaTypeTraits {
	canBeVariable?: boolean
	canBeViewerVariable?: boolean
	canBeCommandArg?: boolean
}

export interface SchemaTypeComparison<
	TSchema extends Schema = Schema,
	OtherType extends SchemaTypeNames = SchemaTypeNames
> {
	equality?(lhs: SchemaType<TSchema>, rhs: SchemaTypeByName<OtherType>): MaybePromise<boolean>
	inequality?(
		lhs: SchemaType<TSchema>,
		rhs: SchemaTypeByName<OtherType>,
		inequality: InequalityOperator
	): MaybePromise<boolean>
}

export function getJSEquality() {
	return {
		equality(lhs: any, rhs: any) {
			return lhs === rhs
		},
	}
}

export function getJSInequality() {
	return {
		inequality(lhs: any, rhs: any, inequality: InequalityOperator) {
			if (inequality == "lessThan") {
				return lhs < rhs
			} else if (inequality == "greaterThan") {
				return lhs > rhs
			} else if (inequality == "lessThanEq") {
				return lhs <= rhs
			} else if (inequality == "greaterThanEq") {
				return lhs >= rhs
			}
			return false
		},
	}
}

export function getJSCompare() {
	return {
		...getJSEquality(),
		...getJSInequality(),
	}
}

export interface SchemaTypeConfig<TSchema extends Schema = Schema> {
	type: TSchema["type"]
	name: string | ((schema: TSchema) => string)
	color: string
	icon: string
	traits: SchemaTypeTraits
	constructDefault: <TTSchema extends TSchema>(schema: TTSchema) => Promise<SchemaType<TTSchema>>
}

export interface SchemaTypeMetaData<TSchema extends Schema = Schema> extends SchemaTypeConfig<TSchema> {
	comparison: Partial<Record<keyof SchemaTypeMap, SchemaTypeComparison<TSchema, keyof SchemaTypeMap>>>
	convertFromString?: (str: string) => MaybePromise<SchemaType<TSchema>>
	convertToString?: (value: SchemaType<TSchema>) => MaybePromise<string>
}

const typeRegistry = new Map<string, SchemaTypeMetaData>()
export function defineSchemaType<TSchema extends Schema>(meta: SchemaTypeConfig<TSchema>) {
	//@ts-expect-error
	typeRegistry.set(meta.type, { ...meta, comparison: {} })
}

export function getSchemaMetaData<TypeName extends SchemaTypeNames>(
	type: TypeName
): SchemaTypeMetaData<SchemaByName<TypeName>> {
	const result = typeRegistry.get(type)
	if (!result) {
		throw new Error(`Invalid Type! "${type}"`)
	}
	return result as SchemaTypeMetaData<SchemaByName<TypeName>>
}

export function getSchemaTypeName<TSchema extends Schema>(schema: TSchema) {
	//@ts-ignore TODO: FIX TYPING HERE
	const metaData = getSchemaMetaData(schema.type)

	if (typeof metaData.name == "string") {
		return metaData.name
	} else {
		//@ts-ignore
		return metaData.name(schema)
	}
}

export function defineSchemaStringConversion<TypeName extends keyof SchemaTypeMap>(
	type: TypeName,
	conversions: {
		convertFromString?: (str: string) => MaybePromise<SchemaTypeByName<TypeName>>
		convertToString?: (value: SchemaTypeByName<TypeName>) => MaybePromise<string>
	}
) {
	const metaData = getSchemaMetaData(type)
	Object.assign(metaData, conversions)
}

export function defineSchemaComparison<LeftType extends keyof SchemaTypeMap, RightType extends keyof SchemaTypeMap>(
	lhs: LeftType,
	rhs: RightType,
	config: {
		equality?(lhs: SchemaTypeByName<LeftType>, rhs: SchemaTypeByName<RightType>): MaybePromise<boolean>
		inequality?(
			lhs: SchemaTypeByName<LeftType>,
			rhs: SchemaTypeByName<RightType>,
			inequality: InequalityOperator
		): MaybePromise<boolean>
	} = getJSCompare()
) {
	const metaData = getSchemaMetaData(lhs)

	if (metaData.comparison[rhs]) {
		Object.assign(metaData.comparison[rhs], config)
	} else {
		metaData.comparison[rhs] = config
	}
}
