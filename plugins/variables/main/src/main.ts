import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	ReactiveRef,
	loadYAML,
	ensureDirectory,
	resolveProjectPath,
	ensureYAML,
	reactiveRef,
	writeYAML,
	PluginManager,
	initingPlugin,
	aliasReactiveValue,
	ReactiveEffect,
	deserializeSchema,
	serializeSchema,
	defineRendererInvoker,
	ipcConvertSchema,
	templateSchema,
	defineRendererCallable,
	runOnChange,
} from "castmate-core"

import { DynamicType, Range, Schema, constructDefault, getTypeByConstructor, getTypeByName } from "castmate-schema"

import { IPCVariableDefinition, isValidJSName } from "castmate-plugin-variables-shared"
import _debounce from "lodash/debounce"

interface VariableDefinition<T = any> {
	id: string
	schema: Schema
	ref: ReactiveRef<T>
	defaultValue: T | string
	//Whether the value is saved to a file.
	serialized: boolean
	serializationEffect?: ReactiveEffect
}

interface SerializedVariableDefinition {
	type: string
	serialized: boolean
	savedValue?: any
	defaultValue: any
}

function toIpcVariableDefinition(def: VariableDefinition): IPCVariableDefinition {
	const type = getTypeByConstructor(def.schema.type)
	if (!type) throw new Error("Missing Type!")
	return {
		id: def.id,
		type: type.name,
		defaultValue: serializeSchema(def.schema, def.defaultValue),
		serialized: def.serialized,
	}
}

const variablesPlugin = definePlugin(
	{
		id: "variables",
		name: "Variables",
		icon: "mdi mdi-variable",
		color: "#D3934A",
	},
	() => {
		const variables = new Map<string, VariableDefinition>()

		const setVariableRenderer = defineRendererInvoker<(def: IPCVariableDefinition) => any>("setVariable")
		const deleteVariableRenderer = defineRendererInvoker<(id: string) => any>("deleteVariable")

		async function serializeVariables() {
			const result: Record<string, SerializedVariableDefinition> = {}
			for (const [id, variable] of variables.entries()) {
				const type = getTypeByConstructor(variable.schema.type)
				if (!type) continue

				result[id] = {
					type: type.name,
					serialized: variable.serialized,
					defaultValue: await serializeSchema(variable.schema, variable.defaultValue),
				}

				if (variable.serialized) {
					result[id].savedValue = await serializeSchema(variable.schema, variable.ref.value)
				}
			}
			await writeYAML(result, "variables", "variables.yaml")
		}

		const debouncedSerialize = _debounce(serializeVariables, 500)

		async function setVariableDef(def: VariableDefinition) {
			const existing = variables.get(def.id)
			if (existing) {
				existing.serializationEffect?.dispose()
			}

			variables.set(def.id, def)
			variablesPlugin.dynamicAddState(def.id, def.schema, def.ref)

			if (def.serialized) {
				def.serializationEffect = await runOnChange(() => def.ref.value, debouncedSerialize)
			}

			await setVariableRenderer(toIpcVariableDefinition(def))
		}

		onLoad(async (plugin) => {
			await ensureYAML({}, "variables", "variables.yaml")
			const variableData = await loadYAML("variables", "variables.yaml")

			for (const id in variableData) {
				const serializedDef: SerializedVariableDefinition = variableData[id]
				const type = getTypeByName(serializedDef.type)
				if (!type) continue

				//@ts-ignore TODO: How to get the compiler to agree with this?
				const schema: Schema = {
					type: type.constructor,
					required: true,
				}

				const defaultValue = await deserializeSchema(schema, serializedDef.defaultValue)

				const value = serializedDef.savedValue
					? await deserializeSchema(schema, serializedDef.savedValue)
					: await templateSchema(defaultValue, schema, PluginManager.getInstance().state)

				const ref = reactiveRef(value)

				const def: VariableDefinition = {
					id,
					schema,
					ref,
					defaultValue,
					serialized: serializedDef.serialized,
				}

				await setVariableDef(def)
			}
		})

		onUnload(async (plugin) => {
			for (const [id, variable] of variables.entries()) {
				variable.serializationEffect?.dispose()
				plugin.dynamicRemoveState(id)
			}
			variables.clear()
		})

		defineRendererCallable("addVariableDefinition", async (ipcDef: IPCVariableDefinition) => {
			if (!isValidJSName(ipcDef.id)) throw new Error(`Invalid Variable Name ${ipcDef.id}`)

			const type = getTypeByName(ipcDef.type)
			if (!type) throw new Error(`Unknown Type: ${ipcDef.type}`)

			const existing = variables.get(ipcDef.id)
			if (existing) throw new Error("Variable Exists")

			//@ts-ignore TODO: How to get the compiler to agree with this?
			const schema: Schema = {
				type: type.constructor,
				required: true,
			}

			const defaultValue = await deserializeSchema(schema, ipcDef.defaultValue)

			const ref = reactiveRef(await templateSchema(defaultValue, schema, PluginManager.getInstance().state))

			const def: VariableDefinition = {
				id: ipcDef.id,
				schema,
				ref,
				defaultValue,
				serialized: ipcDef.serialized,
			}

			await setVariableDef(def)
			debouncedSerialize()
		})

		defineRendererCallable("setVariableDefinition", async (originalId: string, ipcDef: IPCVariableDefinition) => {
			if (!isValidJSName(ipcDef.id)) throw new Error(`Invalid Variable Name ${ipcDef.id}`)

			const type = getTypeByName(ipcDef.type)
			if (!type) throw new Error(`Unknown Type: ${ipcDef.type}`)

			const existing = variables.get(originalId)
			if (!existing) throw new Error(`Missing Variable ${originalId}`)

			//@ts-ignore TODO: How to get the compiler to agree with this?
			const schema: Schema = {
				type: type.constructor,
				required: true,
			}

			const defaultValue = await deserializeSchema(schema, ipcDef.defaultValue)

			const ref = existing.ref

			if (existing.schema.type != schema.type) {
				//If we've changed type, revert to the default
				ref.value = await templateSchema(defaultValue, schema, PluginManager.getInstance().state)
			}

			existing.schema = schema
			existing.defaultValue = defaultValue
			existing.serialized = ipcDef.serialized

			if (originalId != ipcDef.id) {
				existing.id = ipcDef.id
				//This is a rename!
				console.log("Renaming", originalId, ipcDef.id)
				variables.delete(originalId)
				deleteVariableRenderer(originalId)
				await variablesPlugin.dynamicRemoveState(originalId)

				variables.set(existing.id, existing)
				await variablesPlugin.dynamicAddState(ipcDef.id, schema, ref)
			}

			setVariableRenderer(toIpcVariableDefinition(existing))
			debouncedSerialize()
		})

		defineRendererCallable("setVariableValue", async (id: string, serializedValue: any) => {
			const def = variables.get(id)
			if (!def) return

			const value = await deserializeSchema(def.schema, serializedValue)
			def.ref.value = value
		})

		defineRendererCallable("deleteVariable", async (id: string) => {
			const def = variables.get(id)
			if (!def) return

			def.serializationEffect?.dispose()

			variables.delete(id)
			variablesPlugin.dynamicRemoveState(id)
			await deleteVariableRenderer(id)

			debouncedSerialize()
		})

		defineRendererCallable("getVariables", () => {
			return [...variables.values()].map((v) => toIpcVariableDefinition(v))
		})

		defineRendererCallable("renameVariable", async (id: string, newId: string) => {
			if (!isValidJSName(newId)) throw new Error("Invalid Variable Name")
			const def = variables.get(id)
			if (!def) return

			variables.delete(id)
			await variablesPlugin.dynamicRemoveState(id)
			await deleteVariableRenderer(id)

			def.id = newId

			variables.set(newId, def)
			await variablesPlugin.dynamicAddState(newId, def.schema, def.ref)
			await setVariableRenderer(toIpcVariableDefinition(def))

			debouncedSerialize()
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
							return [...variables.keys()]
						},
					},
					value: {
						type: DynamicType,
						async dynamicType(context: { variable: string }) {
							const variable = variables.get(context.variable)

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
				const variable = variables.get(config.variable)

				if (!variable) return //TODO: Log

				variable.ref.value = config.value
			},
		})

		defineAction({
			id: "inc",
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
							return [...variables.values()].filter((v) => v.schema.type == Number).map((v) => v.id)
						},
					},
					offset: {
						type: DynamicType,
						async dynamicType(context: { variable: string }) {
							const variable = variables.get(context.variable)

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

							//console.log("DYNAMIC TYPE", result)

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
				const variable = variables.get(config.variable)

				if (!variable) return //TODO: Log

				variable.ref.value = Range.clamp(config.clamp, variable.ref.value + config.offset)
			},
		})
	}
)

export default variablesPlugin
