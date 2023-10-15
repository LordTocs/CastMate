import {
	BooleanExpression,
	BooleanExpressionGroup,
	BooleanSubExpression,
	BooleanValueExpression,
	ExpressionValue,
} from "castmate-schema"
import { PluginManager } from "../plugins/plugin-manager"

function getExpressionValue(expression: ExpressionValue) {
	if (expression.type == "state") {
		if (!expression.plugin) return undefined
		if (!expression.state) return undefined

		const state = PluginManager.getInstance().getState(expression.plugin, expression.state)
		return state?.ref.value
	} else if (expression.type == "value") {
		return expression.value
	}
	return undefined
}

function evaluateValueExpression(expression: BooleanValueExpression) {
	const left = getExpressionValue(expression.lhs)
	const right = getExpressionValue(expression.rhs)

	if (expression.operator == "equal") {
		return left == right
	} else if (expression.operator == "notEqual") {
		return left != right
	} else if (expression.operator == "lessThan") {
		return left < right
	} else if (expression.operator == "greaterThan") {
		return left > right
	} else if (expression.operator == "lessThanEq") {
		return left <= right
	} else if (expression.operator == "greaterThanEq") {
		return left >= right
	}
}

function evaluateGroupExpression(expression: BooleanExpressionGroup) {
	if (expression.operands.length == 0) return true

	const results = expression.operands.map((o) => {
		if ("operands" in o) {
			return evaluateGroupExpression(o)
		} else {
			return evaluateValueExpression(o)
		}
	})

	if (expression.operator == "and") {
		for (const result of results) {
			if (!result) return false
		}
		return true
	} else {
		for (const result of results) {
			if (result) return true
		}
		return false
	}
}

export function evalueBooleanExpression(expression: BooleanExpression) {
	return evaluateGroupExpression(expression)
}
