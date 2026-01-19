import { ExpressionNode } from "../expression"

export interface ObjectAccessExpression extends ExpressionNode {
	plugin: "castmate"
	node: "objectAccess"
	object: ExpressionNode
	key: ExpressionNode
}

export interface ArrayAccessExpression extends ExpressionNode {
	plugin: "castmate"
	node: "arrayAccess"
	array: ExpressionNode
	index: ExpressionNode
}
