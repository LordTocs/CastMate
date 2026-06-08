import {
	ExpressionNodeSpecification,
	Schema,
	SchemaType,
	testExpr,
	S,
	TSchemaProperties,
	SchemaArgTypes,
	SchemaObject,
	ExpressedSchemaType,
	ExpressionContext,
	SchemaMeta,
	isExpressionNode,
} from "castmate-schema"
import { Service } from "../util/service"

interface ExpressionNodeImplDesc<
	TOutput extends Schema,
	TOperands extends Schema[],
	TConfig extends TSchemaProperties
> {
	compute(
		config: SchemaType<SchemaObject<TConfig>>,
		...operands: SchemaArgTypes<TOperands>
	): Promise<SchemaType<TOutput>>
}

type ta<TArgs extends Schema[]> = TArgs
function def<TArgs extends Schema[]>(desc: ta<TArgs>) {
	return desc
}
const t = def([S.Number(), S.String()])

export interface ExpressionNodeImplementation<
	TOutput extends Schema = Schema,
	TOperands extends Schema[] = Schema[],
	TConfig extends TSchemaProperties = {}
> {
	spec: ExpressionNodeSpecification<TOutput, TOperands, TConfig>
	compute(
		config: SchemaType<SchemaObject<TConfig>>,
		...operands: SchemaArgTypes<TOperands>
	): Promise<SchemaType<TOutput>>
}

export function implementExpression<
	TOutput extends Schema,
	TOperands extends Schema[],
	TConfig extends TSchemaProperties
>(
	spec: ExpressionNodeSpecification<TOutput, TOperands, TConfig>,
	impl: ExpressionNodeImplDesc<TOutput, TOperands, TConfig>
): ExpressionNodeImplementation<TOutput, TOperands, TConfig> {
	const result: ExpressionNodeImplementation<TOutput, TOperands, TConfig> = {
		spec,
		...impl,
	}

	ExpressionNodeService.getInstance().registerNodeImplementation(result)

	return result
}

export const ExpressionNodeService = Service(
	class {
		private nodes = new Map<string, Map<string, ExpressionNodeImplementation>>()

		getNodeImplementation(plugin: string, id: string) {
			return this.nodes.get(plugin)?.get(id)
		}

		registerNodeImplementation(impl: ExpressionNodeImplementation) {
			let pluginMap = this.nodes.get(impl.spec.plugin)
			if (pluginMap == null) {
				pluginMap = new Map()
				this.nodes.set(impl.spec.plugin, pluginMap)
			}
			if (pluginMap.has(impl.spec.id)) {
				throw new Error(`Plugin ${impl.spec.plugin} already has expression node with id "${impl.spec.id}"`)
			}

			pluginMap.set(impl.spec.id, impl)
		}
	}
)

implementExpression(testExpr, {
	async compute(config, a, b) {
		return ""
	},
})

export async function evaluateExpression<TSchema extends Schema>(
	schema: TSchema,
	expr: ExpressedSchemaType<TSchema>,
	context: ExpressionContext
): Promise<SchemaType<TSchema>> {
	if (!SchemaMeta.isExpressable(schema)) {
		if (isExpressionNode(expr)) {
			throw new Error("Expression provided for in expressable schema")
		}
		return expr as SchemaType<TSchema>
	}

	if (!isExpressionNode(expr)) {
		return expr as SchemaType<TSchema>
	}

	const expressionNodeImpl = ExpressionNodeService.getInstance().getNodeImplementation(expr.plugin, expr.id)
	if (!expressionNodeImpl) {
		throw new Error(`Expression ${expr.plugin}.${expr.id} is missing an implementation`)
	}

	const args =
		expr.operands != null
			? await Promise.all(
					expr.operands.map((operand, index) =>
						evaluateExpression(expressionNodeImpl.spec.operands[index], operand, context)
					)
			  )
			: []

	//@ts-expect-error Todo: solve this generic typing
	const result = expressionNodeImpl.compute(expr.config ?? {}, ...args)

	return result
}
