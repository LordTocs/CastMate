



function cleanVueObjectProps(objPropSchema) {
    const result = {}
    for (let propKey in objPropSchema) {
        result[propKey] = {
            ...objPropSchema[propKey],
            type: objPropSchema[propKey].type.name
        }

        if (typeof result[propKey].default === 'function')
        {
            result[propKey].default = result[propKey].default()
        }

        if (result[propKey].type === 'Object')
        {
            //Recursively clean inner types
            if (result[propKey].properties)
            {
                result[propKey].properties = cleanVueObjectProps(result[propKey].properties)
            }
        }

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
    return {
        type: 'Object',
        properties: cleanVueObjectProps(propSchema)
    }
}