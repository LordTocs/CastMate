import { Schema, S } from "./schema-base"
import { SchemaArgTypes, SchemaType } from "./schema-typing"

//Currently explicitly not a proper Schema type, as we I hope we don't really need function support in the schemas.
//This could change though.

export interface SchemaFunction<TReturns extends Schema = Schema, TArgs extends Schema[] = Schema[]> {
	returns: TReturns
	args: TArgs
}

export interface TSchemaFunctionSet {
	[key: string]: SchemaFunction
}

export type SchemaFuncType<TFunc extends SchemaFunction, TThis = unknown> = TFunc extends SchemaFunction<
	infer TReturns extends Schema,
	infer TArgs extends Schema[]
>
	? (this: TThis, ...args: SchemaArgTypes<TArgs>) => SchemaType<TReturns>
	: never

export type AsyncSchemaFuncType<TFunc extends SchemaFunction, TThis = unknown> = TFunc extends SchemaFunction<
	infer TReturns extends Schema,
	infer TArgs extends Schema[]
>
	? (this: TThis, ...args: SchemaArgTypes<TArgs>) => Promise<SchemaType<TReturns>>
	: never

export type SchemaFunctionSetType<TFuncs extends TSchemaFunctionSet, TThis = unknown> = {
	[key in keyof TFuncs]: SchemaFuncType<TFuncs[key], TThis>
}

export type AsyncSchemaFunctionSetType<TFuncs extends TSchemaFunctionSet, TThis = unknown> = {
	[key in keyof TFuncs]: AsyncSchemaFuncType<TFuncs[key], TThis>
}

declare module "./schema-base" {
	namespace S {
		function Function<TReturns extends Schema = Schema, TArgs extends Schema[] = Schema[]>(
			returns: TReturns,
			args: [...TArgs]
		): SchemaFunction<TReturns, TArgs>
	}
}

S.Function = (returns, args) => {
	return {
		returns,
		args,
	}
}
