import { DataFactory, SchemaBase, SchemaTypeConstructorFactories, registerType } from "../schema"
import { Range } from "./range"

export type ValueCompareOperator = "lessThan" | "lessThanEq" | "equal" | "notEqual" | "greaterThan" | "greaterThanEq"

interface StateExpressionValue {
	type: "state"
	plugin: string | undefined
	state: string | undefined
}

interface ResourceExpressionValue {
	type: "resource"
	resourceType: string | undefined
	resourceId: string | undefined
	state: string | undefined
}

interface ValueExpressionValue {
	type: "value"
	schemaType: string
	value: any
}

export type ExpressionValue = StateExpressionValue | ResourceExpressionValue | ValueExpressionValue

export function isStateValueExpr(expr: ExpressionValue): expr is StateExpressionValue {
	return expr.type == "state"
}

export function isResourceValueExpr(expr: ExpressionValue): expr is ResourceExpressionValue {
	return expr.type == "resource"
}

export function isValueValueExpr(expr: ExpressionValue): expr is ValueExpressionValue {
	return expr.type == "value"
}

export interface BooleanValueExpression {
	type: "value"
	id: string
	operator: ValueCompareOperator
	lhs: ExpressionValue
	rhs: ExpressionValue
}

export interface BooleanRangeExpression {
	type: "range"
	id: string
	lhs: ExpressionValue
	range: Range
}

export interface BooleanExpressionGroup {
	type: "group"
	operator: "and" | "or"
	operands: BooleanSubExpression[]
}

export interface BooleanSubExpressionGroup extends BooleanExpressionGroup {
	id: string
}
export type BooleanSubExpression = BooleanSubExpressionGroup | BooleanValueExpression | BooleanRangeExpression

export function isBooleanGroup(expr: BooleanSubExpression): expr is BooleanSubExpressionGroup {
	return expr.type == "group"
}

export function isBooleanValueExpr(expr: BooleanSubExpression): expr is BooleanValueExpression {
	return expr.type == "value"
}

export function isBooleanRangeExpr(expr: BooleanSubExpression): expr is BooleanRangeExpression {
	return expr.type == "range"
}

export type BooleanExpression = BooleanExpressionGroup
export type BooleanExpressionFactory = DataFactory<BooleanExpression>
export const BooleanExpression: BooleanExpressionFactory = {
	factoryCreate() {
		return { type: "group", operator: "and", operands: [] } as BooleanExpression
	},
}

export interface SchemaBooleanExpression extends SchemaBase<BooleanExpression> {
	type: BooleanExpressionFactory
}

declare module "../schema" {
	interface SchemaTypeMap {
		BooleanExpression: [SchemaBooleanExpression, BooleanExpression]
	}
}

registerType("BooleanExpression", {
	constructor: BooleanExpression,
})
