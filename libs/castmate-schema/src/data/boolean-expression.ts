import { SchemaBase, registerType } from "../schema"

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
	value: any
}

export type ExpressionValue = StateExpressionValue | ResourceExpressionValue | ValueExpressionValue

export interface BooleanValueExpression {
	id: string
	operator: ValueCompareOperator
	lhs: ExpressionValue
	rhs: ExpressionValue
}

export interface BooleanExpressionGroup {
	operator: "and" | "or"
	operands: BooleanSubExpression[]
}

export interface BooleanSubExpressionGroup extends BooleanExpressionGroup {
	id: string
}
export type BooleanSubExpression = BooleanSubExpressionGroup | BooleanValueExpression

export type BooleanExpression = BooleanExpressionGroup
export const BooleanExpression = {
	factoryCreate() {
		return { operator: "and", operands: [] } as BooleanExpression
	},
}

export interface SchemaBooleanExpression extends SchemaBase<BooleanExpression> {
	type: BooleanExpression
}

declare module "../schema" {
	interface SchemaTypeMap {
		BooleanExpression: [SchemaBooleanExpression, BooleanExpression]
	}
}

registerType("BooleanExpression", {
	constructor: BooleanExpression,
})
