import { SchemaBase, registerType } from "../schema"

type ValueCompareOperator = "lessThan" | "lessThanEq" | "equal" | "notEqual" | "greaterThan" | "greaterThanEq"

interface StateExpressionValue {
	type: "state"
	plugin: string
	state: string
}

interface ResourceExpressionValue {
	type: "resource"
	resourceType: string
	resourceId: string
	state: string
}

interface TemplateExpressionValue {
	type: "template"
	template: string
}

type ExpressionValue = StateExpressionValue | ResourceExpressionValue | TemplateExpressionValue

interface ValueBooleanExpression {
	operator: ValueCompareOperator
	lhs: ExpressionValue
	rhs: ExpressionValue
}

interface BooleanGroup {
	operator: "and" | "or"
	operands: BooleanSubExpression[]
}
type BooleanSubExpression = BooleanGroup | ValueBooleanExpression

export type BooleanExpression = BooleanGroup
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
