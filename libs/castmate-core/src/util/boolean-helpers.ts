import {
	BooleanExpression,
	BooleanExpressionGroup,
	BooleanSubExpression,
	BooleanValueExpression,
	ExpressionValue,
	Schema,
	ValueCompareOperator,
	getTypeByConstructor,
} from "castmate-schema"
import { PluginManager } from "../plugins/plugin-manager"
import { unexposeSchema } from "./ipc-schema"

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

function getExpressionSchema(expression: ExpressionValue): Schema | undefined {
	if (expression.type == "state") {
		if (!expression.plugin) return undefined
		if (!expression.state) return undefined

		const state = PluginManager.getInstance().getState(expression.plugin, expression.state)
		return state?.schema
	}
}

function baseCompare(left: any, right: any, operator: ValueCompareOperator) {
	if (operator == "equal") {
		return left == right
	} else if (operator == "notEqual") {
		return left != right
	} else if (operator == "lessThan") {
		return left < right
	} else if (operator == "greaterThan") {
		return left > right
	} else if (operator == "lessThanEq") {
		return left <= right
	} else if (operator == "greaterThanEq") {
		return left >= right
	}
	return false
}

async function evaluateValueExpression(expression: BooleanValueExpression) {
	let left = getExpressionValue(expression.lhs)
	const leftSchema = getExpressionSchema(expression.lhs)
	let right = getExpressionValue(expression.rhs)
	const rightSchema = getExpressionSchema(expression.rhs)

	let compareFunc = baseCompare

	if (rightSchema) {
		right = await unexposeSchema(rightSchema, right)
	}

	if (leftSchema) {
		left = await unexposeSchema(leftSchema, left)
		const typeMeta = getTypeByConstructor(leftSchema.type)
		if (typeMeta?.compare) {
			compareFunc = typeMeta.compare
		}
	}

	return compareFunc(left, right, expression.operator)
}

async function evaluateGroupExpression(expression: BooleanExpressionGroup) {
	if (expression.operands.length == 0) return true

	const results = (
		await Promise.allSettled(
			expression.operands.map(async (o) => {
				if ("operands" in o) {
					return await evaluateGroupExpression(o)
				} else {
					return await evaluateValueExpression(o)
				}
			})
		)
	).map((r) => {
		if (r.status == "rejected") return false
		return r.value
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

export async function evalueBooleanExpression(expression: BooleanExpression) {
	return await evaluateGroupExpression(expression)
}
