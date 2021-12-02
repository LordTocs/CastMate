import _cloneDeep from 'lodash/cloneDeep'

export function changeObjectKey(object, oldKey, newKey)
{
	const keyMap = { [oldKey]: newKey };
	const keyValues = Object.keys(object).map((key) =>
	{
		const newKey = key in keyMap ? keyMap[key] : key;
		return { [newKey]: object[key] };
	});

	return Object.assign({}, ...keyValues);
}

export function constructDefaultSchema(schema)
{
	if (schema.type == "Object")
	{
		const result = {};
		for (let prop in schema.properties)
		{
			const value = constructDefaultSchema(schema.properties[prop])
			if (value !== null)
			{
				result[prop] = value;
			}
		}
		return result;
	}
	else if (schema.default)
	{
		return _cloneDeep(schema.default)
	}
	else
	{
		return null;
	}

}