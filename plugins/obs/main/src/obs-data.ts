import { Color, Directory, FilePath, registerType, Schema, SchemaObj } from "castmate-schema"

import { OBSProperty, OBSPropertyPathType, OBSPropertyListType, OBSPropertyFormat } from "castmate-plugin-obs-shared"

export interface SceneSource {
	value: number
	name: string
}

//https://docs.obsproject.com/reference-properties#general-functions

export function createSchemaPropFromOBSProperty(prop: OBSProperty, template: boolean): Schema {
	if (prop.type == "Bool") {
		return { type: Boolean, name: prop.name }
	} else if (prop.type == "Int") {
		return { type: Number, name: prop.name, min: prop.min, max: prop.max, step: prop.step, template }
	} else if (prop.type == "IntSlider") {
		return { type: Number, name: prop.name, min: prop.min, max: prop.max, step: prop.step, template }
	} else if (prop.type == "Float") {
		return { type: Number, name: prop.name, min: prop.min, max: prop.max, step: prop.step, template }
	} else if (prop.type == "Color") {
		return { type: Color, name: prop.name, template }
	} else if (prop.type == "Path" && prop.pathType == OBSPropertyPathType.directory) {
		return { type: Directory, name: prop.name, template, default: prop.defaultPath }
	} else if (prop.type == "Path") {
		return { type: FilePath, name: prop.name, template, default: prop.defaultPath }
	} else if (prop.type == "Text") {
		return { type: String, name: prop.name, template }
	} else if (prop.type == "List" && prop.listType == OBSPropertyListType.list) {
		return {
			type: String,
			name: prop.name,
			template,
			enum: async () => {
				//TODO: Connect to the websocket and grab items
				return []
			},
		}
	} else if (prop.type == "Group") {
		const subSchema = createSchemaFromPropertyFormat(prop.subProps)
		subSchema.name = prop.name
		return subSchema
	}

	throw new Error(`Unsupported OBS Prop Type ${prop.type}`)
}

export function createSchemaFromPropertyFormat(format: OBSPropertyFormat): SchemaObj {
	const result: SchemaObj = {
		type: Object,
		properties: {},
	}

	for (const key in format) {
		const prop = format[key]
	}

	return result
}
