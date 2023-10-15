import {
	BooleanExpression,
	BooleanExpressionGroup,
	BooleanSubExpression,
	BooleanValueExpression,
	ExpressionValue,
} from "castmate-schema"
import { MaybeRefOrGetter, computed, toValue } from "vue"
import { usePluginStore } from "../../../../main"

function getExpressionValue(expression: ExpressionValue, pluginStore: ReturnType<typeof usePluginStore>) {
	if (expression.type == "state") {
		if (!expression.plugin) return undefined
		if (!expression.state) return undefined
		return pluginStore.pluginMap.get(expression.plugin)?.state?.[expression.state]?.value
	} else if (expression.type == "value") {
		return expression.value
	}
	return undefined
}

function evaluateValueExpression(expression: BooleanValueExpression, pluginStore: ReturnType<typeof usePluginStore>) {
	const left = getExpressionValue(expression.lhs, pluginStore)
	const right = getExpressionValue(expression.rhs, pluginStore)

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

function evaluateGroupExpression(expression: BooleanExpressionGroup, pluginStore: ReturnType<typeof usePluginStore>) {
	if (expression.operands.length == 0) return true

	const results = expression.operands.map((o) => {
		if ("operands" in o) {
			return evaluateGroupExpression(o, pluginStore)
		} else {
			return evaluateValueExpression(o, pluginStore)
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

export function useBooleanExpressionEvaluator(
	expression: MaybeRefOrGetter<BooleanExpressionGroup | BooleanValueExpression | undefined>
) {
	const pluginStore = usePluginStore()

	return computed(() => {
		const exp = toValue(expression)
		if (!exp) return true
		if ("operands" in exp) {
			return evaluateGroupExpression(exp, pluginStore)
		} else {
			return evaluateValueExpression(exp, pluginStore)
		}
	})
}
