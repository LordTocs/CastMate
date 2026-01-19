import { InequalityOperator } from "../expression/nodes/comparison-expression"
import { MaybePromise } from "../util/type-helpers"
import { ResolvedSchemaType, ResolvedSchemaTypeByName, SchemaByName } from "./schema-typing"

export interface Schema extends SchemaBaseOptions {
	type: string
}

export interface Defaultable<T> {
	default?: T | (() => MaybePromise<T>)
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

export interface SchemaBase<Type extends string = string, ResultType = any> extends SchemaInternalOptions {
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

	export function InExpressable<TSchema extends SchemaBase>(schema: TSchema): InexpressableSchema<TSchema> {
		return {
			...schema,
			inExpressable: true,
		}
	}
}

export function isSchemaType<Type extends string>(schema: unknown, type: Type): schema is { type: Type } {
	if (!schema) return false
	if (typeof schema != "object") return false
	if (!("type" in schema)) return false
	return schema.type == type
}

export interface SchemaMapping<TSchema extends Schema = any, ResolvedType = any, UnresolvedType = never> {
	schema: TSchema
	resolvedType: ResolvedType
	unresolvedType: UnresolvedType
}

export interface SchemaTypeMap {}

export interface SchemaTypeTraits {
	canBeVariable: boolean
	canBeViewerVariable: boolean
	canBeCommandArg?: boolean
}

export interface SchemaTypeConfig<TSchema extends Schema = Schema> {
	type: TSchema["type"]
	name: string
	color: string
	icon: string
	traits: SchemaTypeTraits
}

export interface SchemaTypeComparison<
	TSchema extends Schema = Schema,
	OtherType extends keyof SchemaTypeMap = keyof SchemaTypeMap
> {
	equality?(lhs: ResolvedSchemaType<TSchema>, rhs: ResolvedSchemaTypeByName<OtherType>): MaybePromise<boolean>
	inequality?(
		lhs: ResolvedSchemaType<TSchema>,
		rhs: ResolvedSchemaTypeByName<OtherType>,
		inequality: InequalityOperator
	): MaybePromise<boolean>
}

export function getJSCompare() {
	return {
		equality(lhs: any, rhs: any) {
			return lhs === rhs
		},
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

export interface SchemaTypeMetaData<TSchema extends Schema = Schema> extends SchemaTypeConfig<TSchema> {
	comparison: Partial<Record<keyof SchemaTypeMap, SchemaTypeComparison<TSchema, keyof SchemaTypeMap>>>
	convertFromString?: (str: string) => MaybePromise<ResolvedSchemaType<TSchema>>
	convertToString?: (value: ResolvedSchemaType<TSchema>) => MaybePromise<string>
}

const typeRegistry = new Map<string, SchemaTypeMetaData>()
export function defineSchemaType<TSchema extends Schema>(meta: SchemaTypeConfig<TSchema>) {
	typeRegistry.set(meta.name, { ...meta, comparison: {} })
}

export function getSchemaType<TypeName extends keyof SchemaTypeMap>(
	type: TypeName
): SchemaTypeMetaData<SchemaByName<TypeName>> {
	const result = typeRegistry.get(type)
	if (!result) {
		throw new Error(`Invalid Type! "${type}"`)
	}
	return result as SchemaTypeMetaData<SchemaByName<TypeName>>
}

export function defineSchemaStringConversion<TypeName extends keyof SchemaTypeMap>(
	type: TypeName,
	conversions: {
		convertFromString?: (str: string) => MaybePromise<ResolvedSchemaTypeByName<TypeName>>
		convertToString?: (value: ResolvedSchemaTypeByName<TypeName>) => MaybePromise<string>
	}
) {
	const metaData = getSchemaType(type)
	Object.assign(metaData, conversions)
}

export function defineSchemaComparison<LeftType extends keyof SchemaTypeMap, RightType extends keyof SchemaTypeMap>(
	lhs: LeftType,
	rhs: RightType,
	config: {
		equality?(
			lhs: ResolvedSchemaTypeByName<LeftType>,
			rhs: ResolvedSchemaTypeByName<RightType>
		): MaybePromise<boolean>
		inequality?(
			lhs: ResolvedSchemaTypeByName<LeftType>,
			rhs: ResolvedSchemaTypeByName<RightType>,
			inequality: InequalityOperator
		): MaybePromise<boolean>
	} = getJSCompare()
) {
	const metaData = getSchemaType(lhs)

	if (metaData.comparison[rhs]) {
		Object.assign(metaData.comparison[rhs], config)
	} else {
		metaData.comparison[rhs] = config
	}
}
