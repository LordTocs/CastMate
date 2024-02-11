import {
	PluginManager,
	ReactiveEffect,
	ReactiveRef,
	Service,
	defineCallableIPC,
	defineIPCFunc,
	deserializeSchema,
	ensureYAML,
	loadYAML,
	reactiveRef,
	runOnChange,
	serializeSchema,
	templateSchema,
	usePluginLogger,
	writeYAML,
} from "castmate-core"
import { IPCVariableDefinition } from "castmate-plugin-variables-shared"
import { Schema, getTypeByConstructor, getTypeByName, isValidJSName } from "castmate-schema"
import _debounce from "lodash/debounce"

import variablePlugin from "./variable-plugin"

export interface VariableDefinition<T = any> {
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

const logger = usePluginLogger("variables")

const setVariableRenderer = defineCallableIPC<(def: IPCVariableDefinition) => any>("variables", "setVariable")
const deleteVariableRenderer = defineCallableIPC<(id: string) => any>("variables", "deleteVariable")

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

export const VariableManager = Service(
	class {
		private variables = new Map<string, VariableDefinition>()

		constructor() {
			defineIPCFunc("variables", "addVariableDefinition", async (ipcDef: IPCVariableDefinition) => {
				await this.addFromIPC(ipcDef)
			})

			defineIPCFunc(
				"variables",
				"setVariableDefinition",
				async (originalId: string, ipcDef: IPCVariableDefinition) => {
					await this.setFromIPC(originalId, ipcDef)
				}
			)

			defineIPCFunc("variables", "setVariableValue", async (id: string, serializedValue: any) => {
				const def = this.getVariable(id)
				if (!def) return

				const value = await deserializeSchema(def.schema, serializedValue)
				def.ref.value = value
			})

			defineIPCFunc("variables", "deleteVariable", async (id: string) => {
				await this.deleteVariable(id)
			})

			defineIPCFunc("variables", "getVariables", () => {
				return this.variableDefinitions.map((v) => toIpcVariableDefinition(v))
			})

			defineIPCFunc("variables", "renameVariable", async (id: string, newId: string) => {
				await this.renameVariable(id, newId)
			})
		}

		private async serializeVariables() {
			logger.log("Serializing Variables...")
			const result: Record<string, SerializedVariableDefinition> = {}
			for (const [id, variable] of this.variables.entries()) {
				const type = getTypeByConstructor(variable.schema.type)
				if (!type) {
					logger.error("Missing Type MetaData", variable.schema.type)
					continue
				}

				result[id] = {
					type: type.name,
					serialized: variable.serialized,
					defaultValue: await serializeSchema(variable.schema, variable.defaultValue),
				}

				if (variable.serialized) {
					result[id].savedValue = await serializeSchema(variable.schema, variable.ref.value)
				}
			}
			try {
				await writeYAML(result, "variables", "variables.yaml")
			} catch (err) {
				logger.error("Failed to serialize variables", err)
			}
		}

		private debouncedSerialize = _debounce(() => this.serializeVariables(), 500)

		private async setDefinition(def: VariableDefinition) {
			const existing = this.variables.get(def.id)
			if (existing) {
				existing.serializationEffect?.dispose()
			}

			this.variables.set(def.id, def)
			variablePlugin.dynamicAddState(def.id, def.schema, def.ref)

			if (def.serialized) {
				def.serializationEffect = await runOnChange(() => def.ref.value, this.debouncedSerialize)
			}

			await setVariableRenderer(toIpcVariableDefinition(def))
		}

		async load() {
			await ensureYAML({}, "variables", "variables.yaml")
			const variableData = await loadYAML("variables", "variables.yaml")

			for (const id in variableData) {
				logger.log("Loading Variable", id)
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

				await this.setDefinition(def)
			}
		}

		async unload() {
			for (const [id, variable] of this.variables.entries()) {
				variable.serializationEffect?.dispose()
				variablePlugin.dynamicRemoveState(id)
			}
			this.variables.clear()
		}

		private async addFromIPC(ipcDef: IPCVariableDefinition) {
			if (!isValidJSName(ipcDef.id)) throw new Error(`Invalid Variable Name ${ipcDef.id}`)

			const type = getTypeByName(ipcDef.type)
			if (!type) throw new Error(`Unknown Type: ${ipcDef.type}`)

			const existing = this.variables.get(ipcDef.id)
			if (existing) throw new Error("Variable Exists")

			logger.log("Adding new Variable", ipcDef.id)

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

			await this.setDefinition(def)
			logger.log("Scheduling Serialize")
			this.debouncedSerialize()
		}

		private async setFromIPC(originalId: string, ipcDef: IPCVariableDefinition) {
			if (!isValidJSName(ipcDef.id)) throw new Error(`Invalid Variable Name ${ipcDef.id}`)

			const type = getTypeByName(ipcDef.type)
			if (!type) throw new Error(`Unknown Type: ${ipcDef.type}`)

			const existing = this.variables.get(originalId)
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
				logger.log("Renaming", originalId, ipcDef.id)
				this.variables.delete(originalId)
				deleteVariableRenderer(originalId)
				await variablePlugin.dynamicRemoveState(originalId)

				this.variables.set(existing.id, existing)
				await variablePlugin.dynamicAddState(ipcDef.id, schema, ref)
			}

			setVariableRenderer(toIpcVariableDefinition(existing))
			this.debouncedSerialize()
		}

		async renameVariable(id: string, newId: string) {
			if (!isValidJSName(newId)) throw new Error("Invalid Variable Name")
			const def = this.variables.get(id)
			if (!def) return

			this.variables.delete(id)
			await variablePlugin.dynamicRemoveState(id)
			await deleteVariableRenderer(id)

			def.id = newId

			this.variables.set(newId, def)
			await variablePlugin.dynamicAddState(newId, def.schema, def.ref)
			await setVariableRenderer(toIpcVariableDefinition(def))

			this.debouncedSerialize()
		}

		async deleteVariable(id: string) {
			const def = this.variables.get(id)
			if (!def) return

			def.serializationEffect?.dispose()

			this.variables.delete(id)
			variablePlugin.dynamicRemoveState(id)
			await deleteVariableRenderer(id)

			this.debouncedSerialize()
		}

		get variableDefinitions() {
			return [...this.variables.values()]
		}

		getVariable<T = any>(id: string) {
			return this.variables.get(id) as VariableDefinition<T>
		}
	}
)
