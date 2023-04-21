import { MapToUnion } from "./../util/type-helpers"
import { cloneDeep } from "lodash"
//TODO: How to type default
//TODO: How to enforce default's existance when required: true

interface SchemaNotRequired {
	required?: false
}

interface SchemaRequired {
	required: true
	default: any
}

type SchemaBase = {
	name?: string
} & (SchemaNotRequired | SchemaRequired)

interface SchemaNumber {
	type: NumberConstructor
	min?: number
	max?: number
	template?: boolean
}

interface SchemaString {
	type: StringConstructor
	template?: boolean
}

interface SchemaBoolean {
	type: BooleanConstructor
	trueIcon?: string
	falseIcon?: string
}

export type SchemaObj = {
	type: ObjectConstructor
	properties: Record<string, Schema>
} & SchemaBase

interface SchemaTypeMap {
	string: [SchemaString, string]
	number: [SchemaNumber, number]
	boolean: [SchemaBoolean, boolean]
}

type SchemaTypeUnion = MapToUnion<SchemaTypeMap>
type SchemaTypes = SchemaTypeUnion[0] & SchemaBase

type SchemaPropTypeInner<T extends Schema> = Extract<
	SchemaTypeUnion,
	T extends { type: infer Constructor } ? [{ type: Constructor }, any] : [never, any]
>[1]

type SchemaPropType<T extends Schema> = T["required"] extends true
	? SchemaPropTypeInner<T>
	: SchemaPropTypeInner<T> | undefined

type SchemaObjType<T extends SchemaObj> = {
	[Property in keyof T["properties"]]: SchemaType<T["properties"][Property]>
}

export type Schema = SchemaTypes | SchemaObj

export type SchemaType<T extends Schema> = T extends SchemaObj ? SchemaObjType<T> : SchemaPropType<T>

export type SchemaClassType<T extends Schema> = SchemaType<T> & {
	constructor: SchemaConstructor<T>
}
export type SchemaConstructor<T extends Schema> = {
	new (...args: any[]): SchemaClassType<T>
	__schema__: T
}

export function defineSchema<T extends SchemaObj>(name: string, schema: T): SchemaConstructor<T> {
	const constructor = class {
		static __schema__ = schema

		constructor() {
			constructDefaultObjOnto(this, constructor.__schema__)
		}
	}

	return constructor as SchemaConstructor<T>
}

function constructDefaultObjOnto<T extends SchemaObj>(target: Record<string, any>, schema: T) {
	for (let prop in schema.properties) {
		const newValue = constructDefault(schema.properties[prop])
		if (newValue != undefined) {
			target[prop] = newValue
		}
	}
}

export function constructDefault<T extends Schema>(schema: T): SchemaType<T> | undefined {
	if (schema.type == Object) {
		const result: Record<string, any> = {}

		if ("properties" in schema) {
			constructDefaultObjOnto(result, schema)
		}

		return result as SchemaType<T>
	} else if (schema.required) {
		return cloneDeep(schema.default)
	}
	return undefined
}
/*
type SquashedObjSchemas<A extends SchemaObj, B extends SchemaObj> = Omit<A, "properties"> &
	Omit<B, "properties"> & {
		type: ObjectConstructor
		properties: {
			[Property in keyof (A["properties"] & B["properties"])]: A["properties"] extends {
				[P in Property]: any
			}
				? B["properties"] extends { [P in Property]: any }
					? SquashedSchemas<A["properties"][Property], B["properties"][Property]>
					: A["properties"][Property]
				: B["properties"][Property]
		}
	}
*/
type SquashedObjSchemas<A extends SchemaObj, B extends SchemaObj> = A & B

export type SquashedSchemas<A extends Schema, B extends Schema> = A extends SchemaObj
	? B extends SchemaObj
		? SquashedObjSchemas<A, B>
		: never
	: A & B

function squashObjSchemas<A extends SchemaObj, B extends SchemaObj>(a: A, b: B): SquashedObjSchemas<A, B> {
	const properties: Record<string, any> = {}
	const keys = Object.keys({ ...a.properties, ...b.properties })
	for (let key of keys) {
		properties[key] = squashSchemas(a.properties[key], b.properties[key])
	}

	return { ...a, ...b, properties } as unknown as SquashedObjSchemas<A, B>
}

type ExtractSchemaObj<T extends Schema> = T extends SchemaObj ? T : never

/**
 * Squash A onto B
 * @param a
 * @param b
 */
export function squashSchemas<A extends Schema, B extends Schema>(a?: A, b?: B): SquashedSchemas<A, B> {
	if (a == null || b == null) {
		if (b != null) return b as SquashedSchemas<A, B>
		if (a != null) return a as SquashedSchemas<A, B>
		throw new Error("Can't merge nothing")
	}

	if (a.type == Object && "properties" in a && "properties" in b) {
		//Both are objects
		return squashObjSchemas<ExtractSchemaObj<A>, ExtractSchemaObj<B>>(
			a as ExtractSchemaObj<A>,
			b as ExtractSchemaObj<B>
		) as unknown as SquashedSchemas<A, B>
	} else if (a.type == b.type) {
		return { ...a, ...b } as SquashedSchemas<A, B>
	}

	throw new Error("INCOMPATIBLE SCHEMAS")
}

/////////////////////////////////

function testSchema<T extends Schema>(spec: { config: T; handle: (config: SchemaType<T>) => any }) {}

testSchema({
	config: {
		type: Object,
		properties: {
			num: { type: Number, template: true, required: true, default: 10 },
			str: { type: String },
		},
	},
	handle(config) {
		config.num = 10
		config.str = "yo"
	},
})

testSchema({
	config: squashObjSchemas(
		{
			type: Object,
			properties: {
				hello: { type: String, required: true, default: "hello" },
				blah: { type: Number, required: true, default: 10 },
			},
		},
		{
			type: Object,
			properties: { goodbye: { type: String }, blah: { type: Number } },
		}
	),
	handle(config) {},
})

const squish = squashSchemas(
	{ type: Object, properties: { hello: { type: String } } },
	{ type: Object, properties: { goodbye: { type: String } } }
)

const TestType = defineSchema("TestType", {
	type: Object,
	properties: {
		num: { type: Number, template: true, required: true, default: 10 },
		str: { type: String },
	},
})
type TestType = InstanceType<typeof TestType>

function f2<A extends SchemaObj, B extends SchemaObj>(a: A, b: B): A {
	const combined = squashObjSchemas(a, b)

	return combined
}
