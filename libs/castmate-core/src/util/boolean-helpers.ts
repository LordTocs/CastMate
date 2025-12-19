import {
	BooleanExpression,
	BooleanExpressionGroup,
	BooleanRangeExpression,
	BooleanSubExpression,
	BooleanValueExpression,
	ExpressionValue,
	Schema,
	ValueCompareOperator,
	getTypeByConstructor,
	isBooleanGroup,
	isBooleanValueExpr,
	Range,
	isBooleanRangeExpr,
	getTypeByName,
	hashString,
} from "castmate-schema"
import { PluginManager } from "../plugins/plugin-manager"
import { unexposeSchema } from "./ipc-schema"
import { templateSchema } from "../templates/template"
import { usePluginLogger } from "../logging/logging"
import { ignoreReactivity } from "../reactivity/reactivity"

const logger = usePluginLogger("booleans")

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

async function getExpressionValueAndSchema(
	expression: ExpressionValue,
	context?: object
): Promise<{ value: any; schema: Schema } | undefined> {
	if (expression.type == "state") {
		const state = await ignoreReactivity(() => {
			if (!expression.plugin) return undefined
			if (!expression.state) return undefined
			return PluginManager.getInstance().getState(expression.plugin, expression.state)
		})
		if (!state) return undefined
		const schema = state.schema
		let value = state.ref.value

		//logger.log("State Value", expression.plugin, expression.state, value)
		value = await unexposeSchema(schema, value)
		//logger.log("Unexposed", value)

		return { value, schema: state.schema }
	} else if (expression.type == "value") {
		const type = getTypeByName(expression.schemaType)
		if (!type) return undefined

		const schema = { type: type.constructor, template: true, required: true }

		//logger.log("Value Value", expression.schemaType, expression.value)

		let value = await templateSchema(expression.value, schema, context ?? PluginManager.getInstance().state)

		//logger.log("Templated", value)

		return { value, schema }
	}

	return undefined
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

async function evaluateValueExpression(expression: BooleanValueExpression, context?: object) {
	const left = await getExpressionValueAndSchema(expression.lhs, context)
	return await evaluateHalfBooleanExpression(left, expression.rhs, expression.operator, context)
}

export async function evaluateHalfBooleanExpression(
	left: { value: any; schema: Schema } | undefined,
	rhs: ExpressionValue,
	operator: ValueCompareOperator,
	context?: object
) {
	const right = await getExpressionValueAndSchema(rhs, context)

	let compareFunc = baseCompare

	let leftValue = left?.value
	let rightValue = right?.value

	if (left?.schema) {
		const meta = getTypeByConstructor(left.schema.type)
		if (meta?.compare) {
			compareFunc = meta.compare
		}
	}

	logger.log("Comparing", leftValue, rightValue, operator)

	return compareFunc(leftValue, rightValue, operator)
}

function inRangeCompare(
	range: Range | undefined,
	value: any,
	compareFunc: (lhs: any, rhs: any, operator: ValueCompareOperator) => boolean
) {
	if (!range) return true //Empty range is considered all numbers

	if (range.min != null) {
		if (compareFunc(value, range.min, "lessThan")) {
			return false
		}
	}

	if (range.max != null) {
		if (compareFunc(value, range.max, "greaterThan")) {
			return false
		}
	}
	return true
}

async function evaluateValueRange(expression: BooleanRangeExpression, context?: object) {
	const left = await getExpressionValueAndSchema(expression.lhs, context)

	let compareFunc = baseCompare

	if (left?.schema) {
		const meta = getTypeByConstructor(left.schema.type)
		if (meta?.compare) {
			compareFunc = meta.compare
		}
	}

	return inRangeCompare(expression.range, left?.value, compareFunc)
}

async function evaluateGroupExpression(expression: BooleanExpressionGroup, context?: object) {
	if (expression.operands.length == 0) return true

	//logger.log("Evaluating", expression)

	const results = (
		await Promise.allSettled(
			expression.operands.map(async (o) => {
				if (isBooleanGroup(o)) {
					return await evaluateGroupExpression(o, context)
				} else if (isBooleanValueExpr(o)) {
					return await evaluateValueExpression(o, context)
				} else if (isBooleanRangeExpr(o)) {
					return await evaluateValueRange(o, context)
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

export async function evaluateBooleanExpression(expression: BooleanExpression, additionalContext?: object) {
	const fullContext = await ignoreReactivity(() => ({
		...additionalContext,
		...PluginManager.getInstance().state,
	}))

	return await evaluateGroupExpression(expression, fullContext)
}

export function getExpressionHash(expression: BooleanExpression) {
	return hashString(JSON.stringify(expression))
}
