import _cloneDeep from 'lodash/cloneDeep'

function cleanVueSchema(schema) {
    if (!schema)
        return {};

    const result = {
        ...schema,
        type: schema.type?.name
    };

    console.log("    Cleaning", schema)

    if (typeof result.default === 'function')
    {
        result.default = result.default()
    }

    if (result.type === 'Object') {
        //Convert the object's properties too
        if (result.properties) {
            for (let propKey in result.properties) {
                result.properties[propKey] = cleanVueSchema(result.properties[propKey])
            }
        }
    }
    else if (result.type === 'Array') {
        if (result.items) {
            result.items = cleanVueSchema(result.items)
        }
    }
    return result
}

function cleanVueObjectProps(objPropSchema) {
    const result = {}
    for (let propKey in objPropSchema) {
        result[propKey] = cleanVueSchema(objPropSchema[propKey])

        delete result[propKey]['0']
        delete result[propKey]['1']
    }
    return result
}

/**
 * Convert a vue props object from a compiled component into a compatible JSON schema object with data-input
 * 
 * @param {*} propSchema 
 */
 export function cleanVuePropSchema(propSchema) {
    propSchema = _cloneDeep(propSchema)
    delete propSchema.size
    delete propSchema.position

    console.log("Cleaning", propSchema)
    const result = {
        type: 'Object',
        properties: cleanVueObjectProps(propSchema)
    }
    console.log("Cleaned To", result);
    return result
}