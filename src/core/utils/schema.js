

export function cleanSchemaForIPC(schema)
{
	let result = { ...schema };

	if (schema.type == Object)
	{
		result.type = "Object";
		if (schema.properties)
		{
			result.properties = {};
			for (let prop in schema.properties)
			{
				result.properties[prop] = cleanSchemaForIPC(schema.properties[prop]);
			}
		}
	}
	else if (!(typeof schema.type == 'string' || schema.type instanceof String) && schema.type) 
	{
		result.type = result.type.name;
	}

	return result;
}