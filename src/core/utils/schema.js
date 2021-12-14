const { ipcMain } = require("electron");
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
const _cloneDeep = require('lodash/cloneDeep');

export function cleanSchemaForIPC(rootName, schema)
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
				result.properties[prop] = cleanSchemaForIPC(rootName + "_" + prop, schema.properties[prop]);
			}
		}
	}
	else
	{
		if (!(typeof schema.type == 'string' || schema.type instanceof String) && schema.type) 
		{
			result.type = result.type.name;
		}

		if (schema.enum instanceof Function || schema.enum instanceof AsyncFunction)
		{
			result.enum = rootName + "_enum";
		}
		if (schema.enumQuery instanceof Function || schema.enumQuery instanceof AsyncFunction)
		{
			result.enumQuery = rootName + "_enumQuery";
		}
	}

	return result;
}

function createIPCFunction(thisObj, name, func)
{
	if (!func)
	{
		return;
	}
	else if (func instanceof AsyncFunction)
	{
		const enumFunc = func.bind(thisObj);
		ipcMain.handle(name, async (...args) =>
		{
			return await enumFunc(...args);
		})
	}
	else if (func instanceof Function)
	{
		const enumFunc = func.bind(thisObj);
		ipcMain.handle(name, (...args) =>
		{
			return enumFunc(...args);
		})
	}
}

export function makeIPCEnumFunctions(thisObj, rootName, schema)
{
	if (schema.type == Object)
	{
		if (schema.properties)
		{
			for (let prop in schema.properties)
			{
				makeIPCEnumFunctions(thisObj, rootName + "_" + prop, schema.properties[prop])
			}
		}
	}
	else
	{
		createIPCFunction(thisObj, rootName + "_enum", schema.enum);
		createIPCFunction(thisObj, rootName + "_enumQuery", schema.enumQuery);
	}


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