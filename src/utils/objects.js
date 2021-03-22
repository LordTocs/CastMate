

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