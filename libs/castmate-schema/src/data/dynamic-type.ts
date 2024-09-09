import { Schema, SchemaBase, registerType } from "../schema"

type DynamicTypeFactory = { factoryCreate(): any }

export const DynamicType: DynamicTypeFactory = {
	factoryCreate() {
		return undefined
	},
}

export interface SchemaDynamicType extends SchemaBase<any> {
	type: DynamicTypeFactory
	dynamicType(context: any): Promise<Schema>
}

declare module "../schema" {
	interface SchemaTypeMap {
		DynamicType: [SchemaDynamicType, any]
	}
}

registerType("DynamicType", {
	constructor: DynamicType,
})
