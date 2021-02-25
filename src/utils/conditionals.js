

function checkValue(key, value, data)
{
	if (key in data)
	{
		return data[key] == value;
	}

	return false;
}

function checkOr(list, data)
{
	for (let subCondition of list)
	{
		if (checkConditions(subCondition, data))
		{
			return true;
		}
	}
	return false;
}

function checkConditions(conditional, data)
{
	if ("or" in conditional)
	{
		return checkOr(conditional.or, data);
	}
	else if ("not" in conditional)
	{
		return !checkConditions(conditional.not, data)
	}
	else
	{
		for (let key in conditional)
		{
			if (!checkValue(key, conditional[key], data))
			{
				return false;
			}
		}
		return true;
	}
}

function evalConditional(conditional, data)
{
	return checkConditions(conditional, data);
}

function dependOnAllConditions(conditional, reactivity, watcher)
{
	if (!reactivity)
		return;

	if ("or" in conditional)
	{
		for (let clause of conditional.or)
		{
			dependOnAll(clause);
		}
	}
	else if ("not" in conditional)
	{
		dependOnAll(conditional.not);
	}
	else
	{
		for (let key in conditional)
		{
			reactivity[key].dependency.addSubscriber(watcher);
		}
		return true;
	}
}

module.exports = { evalConditional, dependOnAllConditions }