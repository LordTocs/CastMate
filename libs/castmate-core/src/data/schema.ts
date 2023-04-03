export interface BaseSchemaDesc {
	name: string
}

export interface StringSchemaDesc extends BaseSchemaDesc {
	template?: Boolean
}

export interface NumberSchemaDesc extends BaseSchemaDesc {
	template?: Boolean
	min?: Number
	max?: Number
	step?: Number
	slider?: Boolean
}

export interface ObjectSchemaDesc extends BaseSchemaDesc {

}


export interface SchemaTypeMap {
	string: [string, StringSchemaDesc]
	number: [number, NumberSchemaDesc]
}


type SchemaTypeUnion = SchemaTypeMap[keyof SchemaTypeMap]
type SchemaTypes = SchemaTypeUnion[0]
type SchemaDesc<T> = Extract<SchemaTypeUnion, [T, any]>[1]


export function SchemaProp<This, T extends SchemaTypes>(
	description: SchemaDesc<T>
) {
	return function (
		target: unknown,
		context: ClassFieldDecoratorContext<This, T>
	) {
        context.addInitializer(function () {
            //TODO: Add to metadata
        })
    }
}

function SchemaTypeInit<Constructor extends new (...args: any[]) => any>(
	constructor: Constructor,
	context: ClassDecoratorContext
) {
	if (context.kind == "class") {
		return class extends constructor {
			toIpc(): any {
				return {}
			}
		}
	}
}


interface SchemaMetaDataEntry {

}

class SchemaMetaData {

}

type SchemaMetaDataFunction = Function & {
    __schema__?: SchemaMetaData
}

abstract class SchemaObjectBase {
    static toJSONSchema() : any {
        const schema = (this.constructor as SchemaMetaDataFunction).__schema__
    }
}

export function SchemaObject<T>() {
    return @SchemaTypeInit class extends SchemaObjectBase {
        static parse(yaml: string) : T {
            return null
        }
    }
}

/// End Developer

class SubSchema extends SchemaObject<SubSchema>() {
    @SchemaProp({
        name: "Blarg"
    })
    x?: number
}

class TestSchema extends SchemaObject<TestSchema>() {
	@SchemaProp({
		name: "Test String",
	})
	strValue: string = "Hello"

	@SchemaProp({
		name: "Test Number",
		min: 10,
		max: 20,
		slider: true,
		step: 1,
	})
	numValue: number = 10

    sub: SubSchema
}

const t = new TestSchema()



