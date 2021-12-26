

function checkOr(list, data)
{
	if (!list || list.length == 0) {
		
		console.log("empty or")
		return true;
		
	}
	for (let subCondition of list)
	{
		if (checkConditions(subCondition, data))
		{
			return true;
		}
	}
	return false;
}

function checkAnd(list, data)
{
	if (!list || list.length == 0)
		return true;
	for (let subCondition of list)
	{
		if (!checkConditions(subCondition, data))
		{
			return false;
		}
	}
	return true;
}

function checkValue(value, data)
{
	let lhs = null;
	if (value.state)
	{
		if(data[value.state.plugin])
		{
			lhs = data[value.state.plugin][value.state.key]
		} 
	}
	const rhs = value.compare;

	//console.log(`Checking ${value.state.plugin}.${value.state.key} (${lhs}) ${value.operator} ${rhs}`);

	if (value.operator == 'lessThan')
	{
		return lhs < rhs;
	}
	else if (value.operator == 'lessThanEq')
	{
		return lhs <= rhs;
	}
	else if (value.operator == 'equal')
	{
		return lhs == rhs;
	}
	else if (value.operator == 'notEqual')
	{
		return lhs != rhs;
	}
	else if (value.operator == 'greaterThan')
	{
		return lhs > rhs;
	}
	else if (value.operator == 'greaterThanEq')
	{
		return lhs >= rhs;
	}
	return false;
}

function checkConditions(conditional, data)
{
	if ("operands" in conditional)
	{
		if (conditional.operator == 'all')
		{
			return checkAnd(conditional.operands, data);
		}
		else if (conditional.operator == 'any')
		{
			return checkOr(conditional.operands, data);
		}
	}
	else if ("operator" in conditional)
	{
		return checkValue(conditional, data);
	}
	return false;
}

function evalConditional(conditional, data)
{
	return checkConditions(conditional, data);
}

function manualDependency(obj, watcher, name)
{
	obj.__reactivity__[name].dependency.addSubscriber(watcher);
}

function dependOnAllConditions(conditional, state, watcher)
{
	if (!state)
		return;

	if ("operands" in conditional)
	{
		for (let clause of conditional.operands)
		{
			dependOnAllConditions(clause, state, watcher);
		}
	}
	else
	{
		const key = conditional.state ? conditional.state.key : undefined;
		const plugin = conditional.state ? conditional.state.plugin : undefined;
		if (!state[plugin] || !key)
			return;

		const reactivity = state[plugin].__reactivity__
		if (reactivity)
		{
			reactivity[key].dependency.addSubscriber(watcher);
		}
	}
}

module.exports = { evalConditional, dependOnAllConditions, manualDependency }