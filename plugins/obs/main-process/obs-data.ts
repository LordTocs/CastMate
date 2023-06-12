class SourceTransform {}

export interface SchemaSourceTransform {
	type: SourceTransform
}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		SourceTransform: [SchemaSourceTransform, SourceTransform]
	}
}
