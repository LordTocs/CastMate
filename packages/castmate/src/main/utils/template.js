
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

export async function evalTemplate(template, data)
{
	let contextObjs = { ...data };

	let func = new AsyncFunction(...Object.keys(contextObjs),`return (${template})`);

	try
	{
		return func(...Object.values(contextObjs));
	}
	catch(err)
	{
		return null;
	}
}

//TODO: Improve backtick string support
function skipString(templateStr, parseContext)
{
	if (!(templateStr[parseContext.i] == '\'' || templateStr[parseContext.i] == '\"' || templateStr[parseContext.i] == '\`'))
	{
		return false; 
	}

	let stringCloser = templateStr[parseContext.i];
	let escaped = false;
	for (; parseContext.i < templateStr.length; ++parseContext.i)
	{
		let char = templateStr[parseContext.i]
		if (!escaped && char == '\\')
		{
			escaped = true;
			continue;
		}
		else if (!escaped && char == stringCloser)
		{
			//This string is finally closed
			return true;
		}
		escaped = false;
	}

	return true;
}

export async function template(templateStr, data)
{
	//Extract stuff inbetween {{ }}
	let resultStr = "";

	let searchStart = 0;
	while (true)
	{
		let index = templateStr.indexOf("{{", searchStart);
		if (index == -1)
		{
			resultStr += templateStr.substr(searchStart);
			break;
		}

		resultStr +=  templateStr.substr(searchStart, index - searchStart);

		let openCurlyCounter = 0;
		let parseContext = { i: index + 2 }
		for (; parseContext.i < templateStr.length; ++parseContext.i)
		{
			if (skipString(templateStr, parseContext))
				continue;
			
			let char = templateStr[parseContext.i];

			if (char == '{')
			{
				++openCurlyCounter;
			}
			else if (char == "}")
			{
				--openCurlyCounter;
				if (openCurlyCounter == -2)
				{
					break;
				}
			}
		}

		let template = templateStr.substr(index + 2, parseContext.i - 2 - (index + 2) + 1);
		let value = undefined;
		try {
			value = await evalTemplate(template, data);
		}
		catch (err) {

		}

		resultStr += (value != null && value != undefined) ? value.toString() : "";
		searchStart = parseContext.i + 1;
	}

	return resultStr;
}
