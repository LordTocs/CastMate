import { defineAction, exposeSchema, onLoad, onUnload, usePluginLogger } from "castmate-core"
import { VariableManager } from "./variable-manager"
import { DynamicType, Range } from "castmate-schema"

export function setupVariableActions() {
	const logger = usePluginLogger()

	onLoad(async () => {
		VariableManager.initialize()
		await VariableManager.getInstance().load()
	})

	onUnload(async () => {
		VariableManager.getInstance().unload()
	})

	defineAction({
		id: "set",
		name: "Set Variable",
		icon: "mdi mdi-variable",
		config: {
			type: Object,
			properties: {
				variable: {
					type: String,
					name: "Variable",
					required: true,
					async enum() {
						return VariableManager.getInstance().variableDefinitions.map((d) => d.id)
					},
				},
				value: {
					type: DynamicType,
					template: true,
					async dynamicType(context: { variable: string }) {
						const variable = VariableManager.getInstance().getVariable(context.variable)

						if (!variable) {
							return {
								type: String,
								name: "Value",
								required: true,
							}
						}

						return {
							...variable.schema,
							name: "Value",
							template: true,
						}
					},
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			const variable = VariableManager.getInstance().getVariable(config.variable)

			if (!variable) return //TODO: Log

			const exposedValue = await exposeSchema(variable.schema, config.value)

			variable.ref.value = exposedValue
		},
	})

	defineAction({
		id: "offset",
		name: "Offset Variable",
		icon: "mdi mdi-variable",
		config: {
			type: Object,
			properties: {
				variable: {
					type: String,
					name: "Variable",
					required: true,
					async enum() {
						return VariableManager.getInstance()
							.variableDefinitions.filter((v) => v.schema.type == Number)
							.map((v) => v.id)
					},
				},
				offset: {
					type: DynamicType,
					template: true,
					async dynamicType(context: { variable: string }) {
						const variable = VariableManager.getInstance().getVariable(context.variable)

						if (!variable) {
							return {
								type: String,
								name: "Value",
								required: true,
								template: true,
							}
						}

						const result = {
							...variable.schema,
							name: "Value",
							template: true,
						}

						return result
					},
				},
				clamp: {
					type: Range,
					name: "Clamp Range",
					template: true,
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			const variable = VariableManager.getInstance().getVariable(config.variable)

			if (!variable) {
				logger.error("Missing Variable", config.variable)
				return
			}

			variable.ref.value = Range.clamp(config.clamp, variable.ref.value + config.offset)
		},
	})
}
