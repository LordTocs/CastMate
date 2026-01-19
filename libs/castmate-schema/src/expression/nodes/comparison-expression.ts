import { ExpressionNode } from "../expression"

export type InequalityOperator = "lessThan" | "lessThanEq" | "greaterThan" | "greaterThanEq"
export type EqualityOperator = "equal" | "notEqual"
export type ComparisonOperator = InequalityOperator | EqualityOperator

export interface ComparisonExpression extends ExpressionNode {
	plugin: "castmate"
	type: "comparison"
	operator: ComparisonOperator
	lhs: ExpressionNode
	rhs: ExpressionNode
}

export interface InRangeExpression extends ExpressionNode {
	plugin: "castmate"
	type: "inRange"
	range: ExpressionNode
	value: ExpressionNode
}

export interface BooleanGroupExpression extends ExpressionNode {
	plugin: "castmate"
	type: "booleanGroup"
	operator: "and" | "or"
	operands: ExpressionNode[]
}

export interface BooleanNotExpression extends ExpressionNode {
	plugin: "castmate"
	type: "booleanNot"
	value: ExpressionNode
}
