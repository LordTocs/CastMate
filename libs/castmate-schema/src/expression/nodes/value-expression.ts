import { SchemaTypeMap } from "../../schema/schema-base"
import { ExpressionNode } from "../expression"

export interface StateExpression extends ExpressionNode {
	plugin: "castmate"
	node: "state"
	statePlugin: string
	stateName: string
}

export interface ResourceStateExpression extends ExpressionNode {
	plugin: "castmate"
	node: "resourceState"
	resourceType: string
	resourceId: string
}

export interface ConstantExpression extends ExpressionNode {
	plugin: "castmate"
	node: "constant"
	type: keyof SchemaTypeMap
	value: any
}

export interface FlowStateExpression extends ExpressionNode {
	plugin: "castmate"
	node: "flowState"
	stateName: string
}
