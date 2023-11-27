import { PluginManager } from "../pluginCore/plugin-manager"
import { templateSchema } from "../state/template"

function checkOr(list, data) {
	if (!list || list.length == 0) {
		return true
	}

	let succeed = false
	for (let subCondition of list) {
		if (checkConditions(subCondition, data)) {
			succeed = true
		}
	}
	return succeed
}

function checkAnd(list, data) {
	if (!list || list.length == 0) return true

	let succeed = true
	for (let subCondition of list) {
		if (!checkConditions(subCondition, data)) {
			succeed = false
		}
	}
	return succeed
}

function checkValue(value, data) {
	let lhs = null
	if (value.state) {
		if (data[value.state.plugin]) {
			lhs = data[value.state.plugin][value.state.key]
		}
	}
	const rhs = value.compare

	// console.log(
	// 	`Checking ${value.state.plugin}.${value.state.key} (${lhs}) ${value.operator} ${rhs}`
	// )

	if (value.operator == "lessThan") {
		return lhs < rhs
	} else if (value.operator == "lessThanEq") {
		return lhs <= rhs
	} else if (value.operator == "equal") {
		return lhs == rhs
	} else if (value.operator == "notEqual") {
		return lhs != rhs
	} else if (value.operator == "greaterThan") {
		return lhs > rhs
	} else if (value.operator == "greaterThanEq") {
		return lhs >= rhs
	}
	return false
}

function checkConditions(conditional, data) {
	if ("operands" in conditional) {
		if (conditional.operator == "all") {
			return checkAnd(conditional.operands, data)
		} else if (conditional.operator == "any") {
			return checkOr(conditional.operands, data)
		}
	} else if ("operator" in conditional) {
		return checkValue(conditional, data)
	}
	return false
}

export function evalConditional(conditional, data) {
	return checkConditions(conditional, data)
}

export async function templateConditional(conditional, context) {
	//console.log("Template Conditional", context)
	if ("operands" in conditional) {
		const operands = await Promise.all(
			conditional.operands.map(
				async (o) => await templateConditional(o, context)
			)
		)

		const result = {
			operator: conditional.operator,
			operands,
		}

		//console.log(result)

		return result
	} else if ("operator" in conditional) {
		const rhs = conditional.compare

		const pluginId = conditional.state?.plugin
		const stateId = conditional.state?.key

		const result = {
			operator: conditional.operator,
			state: conditional.state,
			compare: rhs,
		}

		if (!pluginId || !stateId) return result

		const plugin = PluginManager.getInstance().getPlugin(pluginId)
		if (!plugin) {
			console.error("Missing Plugin", pluginId)
			return result
		}

		let stateSchema = undefined

		if (pluginId != "variables") {
			stateSchema = plugin.stateSchemas[stateId]
		} else {
			stateSchema = plugin.pluginObj.variableSpecs[stateId]
		}

		if (!stateSchema) return result

		stateSchema = { ...stateSchema, template: true }

		result.compare = await templateSchema(rhs, stateSchema, context)
		//console.log("Template Condition", stateSchema, result)

		return result
	}
}

export function manualDependency(obj, watcher, name) {
	obj.__reactivity__[name].dependency.addSubscriber(watcher)
}

export function dependOnAllConditions(conditional, state, watcher) {
	if (!state) return

	if ("operands" in conditional) {
		for (let clause of conditional.operands) {
			dependOnAllConditions(clause, state, watcher)
		}
	} else {
		const key = conditional.state ? conditional.state.key : undefined
		const plugin = conditional.state ? conditional.state.plugin : undefined
		if (!state[plugin] || !key) return

		const reactivity = state[plugin].__reactivity__
		if (reactivity) {
			reactivity[key].dependency.addSubscriber(watcher)
		}
	}
}
